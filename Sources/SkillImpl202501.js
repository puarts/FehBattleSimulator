// スキル実装

    // Tome of Grief
    // At start of turn, if unit's HP ≥ 25%,
    // inflicts Atk/Res–7 and status preventing counterattacks
    // on closest foes and foes within 2 spaces of those foes
    // through their next actions.
    // At start of combat, if unit's HP ≥ 25%,
    // grants Atk/Spd/Def/Res+5 to unit,
    // neutralizes foe's bonuses to Atk/Res,
    // and grants Special cooldown charge +1 to unit per attack during combat
    // (only highest value applied; does not stack).
    // At start of combat, if unit's HP ≥ 25%,
    // grants Atk/Spd/Def/Res+5 to unit,
    // neutralizes penalties to unit's Atk/Res,
    // deals damage = 20% of unit's Res (excluding area-of-effect Specials),
    // and unit makes a guaranteed follow-up attack during combat.
    // This skill can only be equipped by its original unit.

    // Tome of Despair
    // Grants Atk+3.
    // At start of combat, if unit's HP ≥ 25%,
    // inflicts Atk/Res–6 on foe,
    // neutralizes foe's bonuses to Atk/Res,
    // and unit deals +X damage during combat
    // (X = highest total penalties among target and foes within 2 spaces of target;
    // excluding area-of-effect Specials).
    // Also, following effects will occur based on the value of:
    // total bonuses on unit + total penalties on foe:
    // if ≥ 5: foe cannot make a follow-up attack
    // if ≥ 10: unit makes a guaranteed follow-up attack
    // if ≥ 15: inflicts Special cooldown charge –1 on foe per attack during combat
    // At start of player phase or enemy phase,
    // if unit's HP ≥ 25%,
    // inflicts Atk/Res–7,
    // [Hush Spectrum] and [Ploy]
    // on closest foes and any foes within 2 spaces of those foes
    // through their next actions.
    // At start of combat, if unit's HP ≥ 25%,
    // inflicts penalty on foe's Atk/Res = 10% of unit's Res at start of combat +6,
    // and reduces damage from foe's attacks by 20% of unit's Res during combat
    // (excluding area-of-effect Specials).
    // This skill can only be equipped by its original unit.

    // Icy Fimbulvetr
    // Grants Atk+3.
    // If there is a dragon, beast, cavalry, or flying ally on the map,
    // enables [Canto (2)].
    // At start of player phase or enemy phase,
    // inflicts Atk/Res–7, (Exposure), and (Guard)
    // on foes with Res < unit's Res and that are within 2 spaces of another foe
    // through their next actions.
    // At start of combat, if unit's HP ≥ 25%,
    // inflicts Atk/Res–6 and Spd–5 on foe,
    // unit makes a guaranteed follow-up attack during combat,
    // and when unit deals damage to foe during combat,
    // restores 7 HP to unit.
    // At start of combat, if unit's HP ≥ 25%,
    // inflicts penalty on foe's Atk/Spd/Res = 10% of unit's Res at start of combat +5,
    // and deals damage = 20% of unit's Res during combat
    // (excluding area-of-effect Specials).
    // When Canto triggers, enables unit to use (Sing/Dance)
    // (once per turn; if similar effects are active, this effect does not trigger;
    // this effect is not treated as an Assist skill,
    // nor is it treated as a Sing or Dance skill).
    // This skill can only be equipped by its original unit.
    //
    // Hrist
    // Grants Spd+3.
    // At start of turn, if unit is within 2 spaces of an ally,
    // grants (Paranoia)
    // and "Special cooldown charge +1 per attack during combat
    // (only highest value applied; does not stack)"
    // to unit and allies within 2 spaces of unit for 1 turn,
    // and deals 1 damage to unit and those allies.
    // At start of combat, if unit's HP ≤ 99% or if Penalty is active on unit,
    // grants bonus to unit's Atk/Spd = 10% of unit's Spd at start of combat +6,
    // deals damage = 20% of unit's Spd (excluding area-of-effect Specials),
    // and reduces damage from foe's first attack by 30% during combat
    // ("first attack" normally means only the first strike;
    // for effects that grant "unit attacks twice," it means the first and second strikes).
    // Enables [Canto (Rem.; Min 1)]
    // Accelerates Special trigger (cooldown count–1).
    // If unit initiates combat or is within 2 spaces of an ally,
    // grants Atk/Spd+6 to unit,
    // deals damage = damage dealt to unit × 2 + 5
    // (max 21; excluding area-of-effect Specials),
    // and neutralizes effects that guarantee foe's follow-up attacks
    // and effects that prevent unit's follow-up attacks during combat.
    // This skill can only be equipped by its original unit.

    // Noble Bow
    // Effective against flying foes.
    // For foes within 3 rows or 3 columns centered on unit,
    // inflicts Atk/Spd/Def/Res–5,
    // neutralizes foe's bonuses during combat,
    // and those foes cannot recover HP during or after combat.
    // (When an effect such as [Feud] is triggered for allies, excluding unit,
    // that effect will also neutralize this skill's
    // "cannot recover HP after combat" effect on their foes.)
    // At start of combat, if unit's HP ≥ 25%,
    // grants bonus to unit's Atk/Spd/Def/Res = 10% of unit's Spd at start of combat,
    // and reduces damage from foe's first attack by 7 during combat
    // ("first attack" normally means only the first strike;
    // for effects that grant "unit attacks twice," it means the first and second strikes).
    // Accelerates Special trigger (cooldown count–1).
    // If unit initiates combat or is within 2 spaces of an ally,
    // grants Atk/Spd/Def/Res+5 to unit,
    // deals damage = 20% of unit's Spd (excluding area-of-effect Specials),
    // grants Special cooldown count–1 to unit before unit's first attack during combat,
    // and restores 7 HP to unit after combat.
    // This skill can only be equipped by its original unit.

    // Godly Breath
    // Accelerates Special trigger (cooldown count–1).
    // If foe's Range = 2, calculates damage using the lower of foe's Def or Res.
    // If unit initiates combat or is within 3 spaces of an ally,
    // inflicts Atk/Spd/Def/Res–5 on foe,
    // unit deals +X × 5 damage (max 25;
    // X = number of [Bonus] effects active on unit and foe,
    // excluding stat bonuses; excluding area-of-effect Specials),
    // unit makes a guaranteed follow-up attack during combat,
    // and reduces damage from attacks during combat
    // and from area-of-effect Specials
    // (excluding Røkkr area-of-effect Specials) by 40%.
    // For foes within 3 rows or 3 columns centered on unit,
    // inflicts Atk/Spd/Def/Res–5,
    // and reduces the percentage of foe's non-Special
    // "reduce damage by X%" skills by 50% during combat
    // (excluding area-of-effect Specials).
    // If foe initiates combat or foe's HP ≥ 75% at start of combat,
    // inflicts penalty on foe's Atk/Spd/Def/Res = 10% of unit's Def at start of combat,
    // and reduces damage from foe's attacks by X × 3 during combat (max 15;
    // X = number of [Bonus] effects active on unit and foe,
    // excluding stat bonuses; excluding area-of-effect Specials).
    // This skill can only be equipped by its original unit.

// Spirit Forest Writ
{
    let skillId = getNormalSkillId(Weapon.SpiritForestWrit);
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE());
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
    ));
}
{
    let skillId = getRefinementSkillId(Weapon.SpiritForestWrit);
    //
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE());
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
    ));
}
{
    let skillId = getSpecialRefinementSkillId(Weapon.SpiritForestWrit);
    //
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE());
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
    ));
}
    // Accelerates Special trigger (cooldown count–1).
    // Effective against dragon foes.
    // If unit initiates combat or is within 3 spaces of an ally,
    // inflicts Atk/Res–6 on foe,
    // reduces damage from foe's attacks by 20% of unit's Res (excluding area-of-effect Specials),
    // unit makes a guaranteed follow-up attack,
    // and disables foe's skills that "calculate damage using the lower of foe's Def or Res" during combat.
    // Also, if unit's Res > foe's Res at start of combat,
    // inflicts penalty on foe's Atk/Res during combat =
    // difference between Res stats at start of combat (max 16).
    // At start of turn, and at start of enemy phase (except for in Summoner Duels),
    // if unit is within 2 spaces of an ally,
    // grants Atk/Res+6
    // and "neutralizes unit's penalties during combat"
    // to unit and allies within 2 spaces of unit for 1 turn.
    // Also, for unit and allies within 2 spaces of unit,
    // if Special cooldown count is at its maximum value,
    // grants Special cooldown count–1.
    // For allies within 2 spaces of unit,
    // if Special cooldown count is at its maximum value after combat,
    // grants Special cooldown count–1.
    // If unit initiates combat or is within 3 spaces of an ally,
    // inflicts Atk/Res–6 on foe,
    // deals damage = 20% of unit's Res during combat
    // (excluding area-of-effect Specials),
    // restores 7 HP to unit after combat,
    // and also, if Special cooldown count is at its maximum value,
    // grants Special cooldown count–1 after combat.
    // This skill can only be equipped by its original unit.

// Fell Child’s Arts
{
    let skillId = Weapon.FellChildsArts;
    // Accelerates Special trigger (cooldown count–1).
    // If foe’s Range = 2, calculates damage using the lower of foe’s Def or Res.
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // Unit attacks twice (even if foe initiates combat, unit attacks twice).
        TARGET_ATTACKS_TWICE_EVEN_IF_TARGETS_FOE_INITIATES_COMBAT_NODE,
    ));
    setAtStartOfCombatAndAfterStatsDeterminedHooks(skillId,
        // If foe initiates combat or if unit’s HP ≥ 25% at start of combat,
        OR_NODE(DOES_FOE_INITIATE_COMBAT_NODE, IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE),
        SKILL_EFFECT_NODE(
            X_NUM_NODE(
                // inflicts penalty on foe’s Atk/Def/Res = 
                INFLICTS_ATK_DEF_RES_ON_FOE_DURING_COMBAT_NODE(READ_NUM_NODE),
                COND_OP(
                    // (max 15; if unit triggers Savior, value is treated as 15),
                    DOES_TARGET_TRIGGER_SAVIOR_NODE,
                    15,
                    // number of distinct game titles among allies within 3 spaces of unit × 3, +9
                    MULT_ADD_MAX_NODE(
                        NUMBER_OF_DISTINCT_GAME_TITLES_AMONG_ALLIES_WITHIN_N_SPACES_OF_UNIT_NODE(3),
                        3, 9, 15),
                ),
            ),
            // reduces the percentage of foe’s non-Special “reduce damage by X%” skills by 50% (excluding area-of-effect Specials),
            REDUCES_PERCENTAGE_OF_TARGETS_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE,
        ),
        SKILL_EFFECT_NODE(
            X_NUM_NODE(
                // unit deals +X damage 
                DEALS_DAMAGE_X_NODE(READ_NUM_NODE),
                // reduces damage from foe’s attacks by X (excluding area-of-effect Specials),
                REDUCES_DAMAGE_FROM_TARGETS_FOES_ATTACKS_BY_X_DURING_COMBAT_NODE(READ_NUM_NODE),
                // and reduces damage from foe’s Specials by X during combat (excluding area-of-effect Specials).
                REDUCES_DAMAGE_WHEN_FOES_SPECIAL_EXCLUDING_AOE_SPECIAL_NODE(READ_NUM_NODE),
                // (X = 20% of unit’s Res; excluding area-of-effect Specials),
                PERCENTAGE_NODE(20, UNITS_RES_NODE),
            ),
        ),
    );
}

// Fell Blast
{
    let skillId = Special.FellBlast;
    setSpecialCount(skillId, 3);
    NORMAL_ATTACK_SPECIAL_SET.add(skillId);
    WHEN_APPLIES_SPECIAL_EFFECTS_AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // Boosts damage by 50% of unit’s Res when Special triggers.
        BOOSTS_DAMAGE_WHEN_SPECIAL_TRIGGERS_NODE(PERCENTAGE_NODE(50, UNITS_RES_NODE)),
    ));
    let nodeFunc = () => SKILL_EFFECT_NODE(
        // At start of player phase or enemy phase, if unit’s HP ≥ 25%,
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_TURN_NODE(
            // to unit and allies within 2 spaces of unit for 1 turn.
            FOR_EACH_TARGET_AND_TARGETS_ALLY_WITHIN_2_SPACES_OF_TARGET_NODE(
                // grants [Fell Spirit] 
                GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.FellSpirit),
            ),
        ),
    );
    AT_START_OF_TURN_HOOKS.addSkill(skillId, nodeFunc);
    AT_START_OF_ENEMY_PHASE_HOOKS.addSkill(skillId, nodeFunc);
    AT_APPLYING_ONCE_PER_COMBAT_DAMAGE_REDUCTION_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // If foe initiates combat, 
        IF_NODE(
            OR_NODE(
                // if unit’s or foe’s Special is ready,
                DOES_FOE_INITIATE_COMBAT_NODE,
                // or if unit’s or foe’s Special triggered before or during this combat,
                IF_UNITS_OR_FOES_SPECIAL_IS_READY_OR_UNITS_OR_FOES_SPECIAL_TRIGGERED_BEFORE_OR_DURING_COMBAT_NODE,
            ),
            // reduces damage from foe’s next attack by 40%
            // (once per combat; excluding area-of-effect Specials).
            REDUCES_DAMAGE_FROM_TARGETS_FOES_NEXT_ATTACK_BY_N_PERCENT_ONCE_PER_COMBAT_NODE(40),
        ),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // Unit can counterattack regardless of foe’s range during combat.
        TARGET_CAN_COUNTERATTACK_REGARDLESS_OF_RANGE_NODE,
    ));
}

// [Fell Spirit]
{
    let skillId = getStatusEffectSkillId(StatusEffectType.FellSpirit);
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // Inflicts Atk/Spd/Def/Res–4 on foe
        INFLICTS_ALL_STATS_MINUS_4_ON_FOE_DURING_COMBAT_NODE,
        // and neutralizes effects that prevent unit’s counterattacks during combat,
        NEUTRALIZES_EFFECTS_THAT_PREVENT_TARGETS_COUNTERATTACKS_DURING_COMBAT_NODE,
        // any “reduces damage by X%” effect that can be triggered only once per combat
        // by unit’s equipped Special skill can be triggered up to twice per combat
        // (excludes boosted Special effects from engaging; only highest value applied; does not stack),
        ANY_TARGETS_REDUCE_DAMAGE_EFFECT_ONLY_ONCE_CAN_BE_TRIGGERED_UP_TO_N_TIMES_PER_COMBAT_NODE(1),
        // and also, when unit or foe is engaged,
        IF_NODE(OR_NODE(IS_TARGET_ENGAGED_NODE, IS_FOE_ENGAGED_NODE),
            // inflicts an additional Atk/Spd/Def/Res–2 on foe during combat. (For 1 turn.)
            INFLICTS_ALL_STATS_MINUS_2_ON_FOE_DURING_COMBAT_NODE,
        ),
    ));
}

// 🅱️ Scowling Fighter
{
    let skillId = PassiveB.ScowlingFighter;
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
    ));
    setAtStartOfCombatAndAfterStatsDeterminedHooks(skillId,
        // If foe initiates combat or if unit’s HP ≥ 25% at start of combat,
        OR_NODE(DOES_FOE_INITIATE_COMBAT_NODE, IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE),
        SKILL_EFFECT_NODE(
            // inflicts Atk/Res–4 on foe,
            INFLICTS_ATK_RES_ON_FOE_DURING_COMBAT_NODE(4),
        ),
        SKILL_EFFECT_NODE(
            // deals damage = 20% of unit’s Res (excluding area-of-effect Specials),
            DEALS_DAMAGE_X_NODE(PERCENTAGE_NODE(20, UNITS_RES_NODE)),
            // reduces damage from foe’s attacks by 20% of unit’s Res (excluding area-of-effect Specials),
            REDUCES_DAMAGE_FROM_TARGETS_FOES_ATTACKS_BY_X_DURING_COMBAT_NODE(
                PERCENTAGE_NODE(20, UNITS_RES_NODE)),
            // and grants Special cooldown charge +1 to unit per attack during combat
            // (only highest value applied; does not stack).
            GRANTS_SPECIAL_COOLDOWN_CHARGE_PLUS_1_TO_UNIT_PER_ATTACK_DURING_COMBAT_NODE,
            // Also, if foe’s attack can trigger foe’s Special
            IF_NODE(CAN_FOES_ATTACK_TRIGGER_FOES_SPECIAL_NODE,
                // and unit’s Res ≥ foe’s Res+5,
                IF_NODE(GTE_NODE(UNITS_EVAL_RES_NODE, ADD_NODE(FOES_EVAL_RES_NODE, 5)),
                    // inflicts Special cooldown count+1 on foe before foe’s first attack during combat
                    // (cannot exceed the foe’s maximum Special cooldown).
                    INFLICTS_SPECIAL_COOLDOWN_COUNT_PLUS_N_ON_TARGETS_FOE_BEFORE_TARGETS_FOES_FIRST_ATTACK_NODE(1),
                ),
            ),
        ),
    );
}

// Fell Child’s Blade
{
    let skillId = Weapon.FellChildsBlade;
    // Accelerates Special trigger (cooldown count–1).
    setAllEffectsForSkillOwnersEnemiesDuringCombatHooks(skillId,
        // For foes within 3 rows or 3 columns centered on unit,
        IS_TARGET_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_SKILL_OWNER_NODE,
        // inflicts Atk/Spd/Def/Res–5
        INFLICTS_ALL_STATS_MINUS_5_ON_FOE_DURING_COMBAT_NODE,
        // and neutralizes foe’s bonuses during combat.
        NEUTRALIZES_FOES_BONUSES_TO_STATS_DURING_COMBAT_NODE,
    );

    setAtStartOfCombatAndAfterStatsDeterminedHooks(skillId,
        // If foe initiates combat or if unit’s HP ≥ 25% at start of combat,
        OR_NODE(DOES_FOE_INITIATE_COMBAT_NODE, IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE),
        SKILL_EFFECT_NODE(
            // inflicts penalty on foe’s Atk/Spd/Def/Res =
            INFLICTS_ALL_STATS_MINUS_N_ON_FOE_DURING_COMBAT_NODE(
                // number of distinct game titles among allies within 3 spaces of unit × 3, +4 (max 10),
                MULT_ADD_MAX_NODE(
                    NUMBER_OF_DISTINCT_GAME_TITLES_AMONG_ALLIES_WITHIN_N_SPACES_OF_UNIT_NODE(3),
                    3, 4, 10),
            ),
            // reduces the percentage of foe’s non-Special “reduce damage by X%” skills by 50% (excluding area-of-effect Specials),
            REDUCES_PERCENTAGE_OF_TARGETS_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE,
        ),
        SKILL_EFFECT_NODE(
            X_NUM_NODE(
                // unit deals +X damage (excluding area-of-effect Specials),
                DEALS_DAMAGE_X_NODE(READ_NUM_NODE),
                // reduces damage from foe’s attacks by X (excluding area-of-effect Specials),
                REDUCES_DAMAGE_FROM_TARGETS_FOES_ATTACKS_BY_X_DURING_COMBAT_NODE(READ_NUM_NODE),
                // reduces damage from foe’s Specials by X during combat (excluding area-of-effect Specials;
                REDUCES_DAMAGE_WHEN_FOES_SPECIAL_EXCLUDING_AOE_SPECIAL_NODE(READ_NUM_NODE),
                // X = 20% of unit’s Spd),
                PERCENTAGE_NODE(20, UNITS_SPD_NODE),
            ),
            // and restores 7 HP to unit after combat.
            RESTORES_7_HP_TO_UNIT_AFTER_COMBAT_NODE,
        ),
    );
}

// 🅰️ Bond Breaker
{
    let skillId = PassiveA.BondBreaker;
    // At start of player phase or enemy phase,
    setAtStartOfPlayerPhaseOrEnemyPhase(skillId,
        () => SKILL_EFFECT_NODE(
            // if unit’s HP ≥ 25%,
            IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_TURN_NODE(
                // to unit and allies within 2 spaces of unit for 1 turn,
                FOR_EACH_TARGET_AND_TARGETS_ALLY_WITHIN_2_SPACES_OF_TARGET_NODE(
                    // grants [Fell Spirit]
                    GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.FellSpirit),
                ),
                // on closest foes and any foes within 2 spaces of those foes through their next actions.
                FOR_EACH_TARGETS_CLOSEST_FOE_AND_ANY_FOE_WITHIN_2_SPACES_OF_THOSE_FOES_NODE(
                    // and inflicts Atk/Spd–7 and
                    INFLICTS_ATK_SPD_ON_TARGET_ON_MAP_NODE(7),
                    // [Schism]
                    INFLICTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.Schism),
                ),
            ),
        )
    );
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // Unit can counterattack regardless of foe’s range.
        TARGET_CAN_COUNTERATTACK_REGARDLESS_OF_RANGE_NODE,
        // If foe initiates combat or if unit’s HP ≥ 25% at start of combat,
        IF_NODE(OR_NODE(DOES_FOE_INITIATE_COMBAT_NODE, IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE),
            // grants Atk/Spd/Def/Res+9 to unit
            GRANTS_ALL_STATS_PLUS_9_TO_TARGET_DURING_COMBAT_NODE,
            // and reduces damage from foe’s first attack by 7 during combat
            // (“first attack” normally means only the first strike;
            // for effects that grant “unit attacks twice,” it means the first and second strikes),
            REDUCES_DAMAGE_FROM_FOES_FIRST_ATTACK_BY_N_DURING_COMBAT_INCLUDING_TWICE_NODE(7),
            // and also, if unit’s HP > 1 and foe would reduce unit’s HP to 0,
            // unit survives with 1 HP (once per combat;
            // does not stack with non-Special effects that allow unit to survive with 1 HP if foe’s attack would reduce HP to 0).
            TARGET_CAN_ACTIVATE_NON_SPECIAL_MIRACLE_NODE(0),
        ),
    ));
}

// 🗡 Martyr’s Staff
{
    let skillId = Weapon.MartysStaff;
    // Calculates damage from staff like other weapons.
    // Accelerates Special trigger (cooldown count–1;
    // max cooldown count value cannot be reduced below 1).
    // At start of player phase or enemy phase,
    setAtStartOfPlayerPhaseOrEnemyPhase(skillId, () =>
        SKILL_EFFECT_NODE(
            // if unit is within 3 spaces of an ally,
            IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_TARGETS_ALLY_NODE,
                // to unit and allies within 3 spaces of unit for 1 turn.
                FOR_EACH_TARGET_AND_TARGETS_ALLY_WITHIN_3_SPACES_OF_TARGET_NODE(
                    // grants Atk/Res+6,
                    GRANTS_ATK_RES_TO_TARGET_ON_MAP_NODE(6),
                    // [Bonus Doubler],
                    // and “neutralizes penalties on unit during combat”
                    GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(
                        StatusEffectType.BonusDoubler,
                        StatusEffectType.NeutralizesPenalties,
                    ),
                ),
            ),
        ),
    );
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // If unit initiates combat or is within 3 spaces of an ally,
        IF_NODE(OR_NODE(DOES_UNIT_INITIATE_COMBAT_NODE, IS_TARGET_WITHIN_3_SPACES_OF_TARGETS_ALLY_NODE),
            // inflicts penalty on foe’s Atk/Res =
            INFLICTS_ATK_RES_ON_FOE_DURING_COMBAT_NODE(
                // 20% of unit’s Res at start of combat +6,
                PERCENTAGE_NODE(20, ADD_NODE(UNITS_RES_AT_START_OF_COMBAT_NODE, 6)),
            ),
            X_NUM_NODE(
                // unit deals +X × 5 damage
                DEALS_DAMAGE_X_NODE(MULT_NODE(READ_NUM_NODE, 5)),
                // (X = the total of the number of Bonus effects active on unit
                // and the number of Penalty effects active on foe,
                // excluding stat bonuses and stat penalties; max 5;
                // excluding area-of-effect Specials).
                ENSURE_MAX_NODE(NUM_OF_BONUSES_ON_TARGET_AND_PENALTIES_ON_FOE_EXCLUDING_STAT_NODE, 5),
            ),
            // If the “calculates damage from staff like other weapons” effect is neutralized,
            // damage from staff is calculated after combat damage is added,
            // and unit makes a guaranteed follow-up attack during combat.
            UNIT_MAKES_GUARANTEED_FOLLOW_UP_ATTACK_NODE,
        ),
    ));
    setForAlliesHooks(skillId,
        IS_TARGET_WITHIN_3_SPACES_OF_SKILL_OWNER_NODE,
        // Grants Atk/Res+5 to allies within 3 spaces of unit during combat.
        GRANTS_ATK_RES_TO_TARGET_DURING_COMBAT_NODE(5),
        // Grants “if unit’s HP > 1 and foe would reduce unit’s HP to 0 during combat,
        // unit survives with 1 HP and after combat, restores 99 HP to unit”
        // to allies within 3 spaces of unit
        // (effect only triggers for player’s team once per map
        // and does not stack with non-Special effects
        // that allow unit to survive with 1 HP if foe’s attack would reduce unit’s HP to 0;
        // when any other such effect triggers on an ally granted this effect,
        // this effect will trigger too).
        GRANTS_MIRACLE_AND_HEAL_TO_TARGET_ONCE_PER_MAP_NODE,
    );
}

// 🗡 Arcane Crest
{
    let skillId = Weapon.ArcaneCrest;
    let reduceNode = SKILL_EFFECT_NODE(
        // deals damage = 15% of unit’s Atk (including area-of-effect Specials),
        DEALS_DAMAGE_X_NODE(PERCENTAGE_NODE(15, UNITS_ATK_NODE)),
        // reduces damage from foe’s attacks by 15% of unit’s Atk
        // (including area-of-effect Specials; excluding Røkkr area-of-effect Specials),
        REDUCES_DAMAGE_BY_N_NODE(PERCENTAGE_NODE(15, UNITS_ATK_NODE)),
    );
    // Accelerates Special trigger (cooldown count–1).
    setBeforeAoeSpecialAtStartOfCombatAndAfterStatsDeterminedHooks(skillId,
        OR_NODE(DOES_FOE_INITIATE_COMBAT_NODE, IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE),
        SKILL_EFFECT_NODE(
            reduceNode,
        ),
        SKILL_EFFECT_NODE(
            // grants bonus to unit’s Atk/Spd/Def/Res =
            GRANTS_ATK_SPD_DEF_RES_TO_TARGET_DURING_COMBAT_NODE(
                // 25% of foe’s Atk at start of combat – 4
                // (max 14; min 5),
                ENSURE_MAX_MIN_NODE(SUB_NODE(PERCENTAGE_NODE(25, FOES_ATK_AT_START_OF_COMBAT_NODE), 4), 14, 5),
            ),
            // neutralizes penalties on unit,
            NEUTRALIZES_PENALTIES_ON_UNIT_NODE,
        ),
        SKILL_EFFECT_NODE(
            reduceNode,
            // and grants Special cooldown count–1 to unit
            // before unit’s first attack during combat.
            GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_N_TO_TARGET_BEFORE_TARGETS_FIRST_ATTACK_DURING_COMBAT_NODE(1),
        ),
    );
    // At start of turn,
    // if unit is adjacent to only beast or dragon allies
    // or if unit is not adjacent to any ally, unit transforms
    // (otherwise, unit reverts).
    // If unit transforms, grants Atk+2,
    // and unit can counterattack regardless of foe’s range.
    setBeastSkill(skillId, BeastCommonSkillType.Armor);
}

// 🅱️ Assault Fighter
{
    let skillId = PassiveB.AssaultFighter;
    setAtStartOfCombatAndAfterStatsDeterminedHooks(skillId,
        // If unit initiates combat or is within 3 spaces of an ally,
        OR_NODE(DOES_UNIT_INITIATE_COMBAT_NODE, IS_TARGET_WITHIN_3_SPACES_OF_TARGETS_ALLY_NODE),
        SKILL_EFFECT_NODE(
            // inflicts Atk/Def–4 on foe,
            INFLICTS_ATK_DEF_ON_FOE_DURING_COMBAT_NODE(4),
        ),
        SKILL_EFFECT_NODE(
            // deals damage = 20% of unit’s Def (excluding area-of-effect Specials),
            DEALS_DAMAGE_X_NODE(PERCENTAGE_NODE(20, UNITS_DEF_NODE)),
            // reduces damage from foe’s attacks by 20% of unit’s Def
            // (excluding area-of-effect Specials),
            REDUCES_DAMAGE_BY_N_NODE(PERCENTAGE_NODE(20, UNITS_DEF_NODE)),
            // unit makes a guaranteed follow-up attack,
            UNIT_MAKES_GUARANTEED_FOLLOW_UP_ATTACK_NODE,
            // and reduces the percentage of foe’s non-Special
            // “reduce damage by X%” skills by 50% during combat
            // (excluding area-of-effect Specials).
            REDUCES_PERCENTAGE_OF_TARGETS_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE,
        ),
    );
}

// 🅲 For the True King
{
    let skillId = PassiveC.ForTheTrueKing;
    // If foe with Range = 2 initiates combat against an ally within 2 spaces of unit,
    // triggers [Savior] on unit.
    SAVE_SKILL_SET.add(skillId);
    CAN_SAVE_FROM_RANGED_SKILL_SET.add(skillId);
    let targetUnitsNode = IF_EXPRESSION_NODE(IS_THERE_SKILL_OWNERS_PARTNER_ON_MAP_NODE,
        TARGETS_PARTNERS_ON_MAP_NODE,
        HIGHEST_ATK_ALLIES_ON_MAP_NODE,
    );
    CAN_TRIGGER_SAVIOR_HOOKS.addSkill(skillId, () =>
        // If foe initiates combat against target ally within 4 spaces of unit,
        // triggers [Savior] on unit.
        AND_NODE(
            IS_TARGET_WITHIN_4_SPACES_OF_SKILL_OWNER_NODE,
            INCLUDES_UNIT_NODE(TARGET_NODE, targetUnitsNode),
        ),
    );
    // (If support partner is on player team,
    // target ally is any support partner; otherwise,
    // target ally is the ally with the highest Atk on player team, excluding unit.)
    // Unit can move to a space within 2 spaces of target ally.
    UNIT_CAN_MOVE_TO_A_SPACE_HOOKS.addSkill(skillId, () =>
        TARGETS_PLACABLE_SPACES_WITHIN_N_SPACES_FROM_UNITS_NODE(2, targetUnitsNode)
    );
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // If unit is transformed or if foe initiates combat,
        IF_NODE(OR_NODE(IS_TARGET_TRANSFORMED_NODE, DOES_FOE_INITIATE_COMBAT_NODE),
            // grants Atk/Def/Res+5 to unit,
            GRANTS_ATK_DEF_RES_TO_TARGET_DURING_COMBAT_NODE(5),
            // unit deals +7 damage (excluding area-of-effect Specials),
            DEALS_DAMAGE_X_NODE(7),
            // reduces damage from foe’s attacks by 7 (excluding area-of-effect Specials),
            REDUCES_DAMAGE_BY_N_NODE(7),
            // and grants Special cooldown count–1 to unit
            // before unit’s first attack during combat.
            GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_N_TO_TARGET_BEFORE_TARGETS_FIRST_ATTACK_DURING_COMBAT_NODE(1),
            // Any “reduces damage by X%” effect
            // that can be triggered only once per combat
            // by unit’s equipped Special skill
            // can be triggered up to twice per combat
            // (excludes boosted Special effects from engaging;
            // only highest value applied; does not stack).
            ANY_TARGETS_REDUCE_DAMAGE_EFFECT_ONLY_ONCE_CAN_BE_TRIGGERED_UP_TO_N_TIMES_PER_COMBAT_NODE(1),
        ),
    ));
}

// Jaws of Closure
{
    let skillId = Weapon.JawsOfClosure;
    // Mt: 14
    // Rng: 1
    // Accelerates Special trigger (cooldown count-1).
    // When unit is in combat, foes' Savior effects will not trigger.
    setWhenUnitIsInCombatFoesSaviorEffectsWillNotTriggerNode(skillId);
    // After unit acts (if Canto triggers, after Canto),
    AFTER_UNIT_ACTS_IF_CANTO_TRIGGERS_AFTER_CANTO_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // on closest foes within 5 spaces of unit
        FOR_EACH_UNIT_NODE(FILTER_UNITS_NODE(TARGETS_CLOSEST_FOES_NODE, IS_TARGET_WITHIN_5_SPACES_OF_SKILL_OWNER_NODE),
            // inflicts (Undefended)
            // through their next actions.
            INFLICTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.Undefended),
        ),
    ));

    setAllEffectsForSkillOwnersEnemiesDuringCombatHooks(skillId,
        // For foes within 3 rows or 3 columns centered on unit,
        IS_TARGET_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_SKILL_OWNER_NODE,
        // inflicts Atk/Spd/Def/Res-5 and
        INFLICTS_ALL_STATS_MINUS_5_ON_FOE_DURING_COMBAT_NODE,
        // reduces the percentage
        // of foe's non-Special "reduce damage by X%" skills by 50% during combat
        // (excluding area-of-effect Specials).
        REDUCES_PERCENTAGE_OF_TARGETS_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE,
    );
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // At start of combat, if unit's HP ≥ 25%,
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE(
            // grants bonus to unit's Atk/Spd/Def/Res = 15% of unit's Spd at start of combat,
            GRANTS_ALL_BONUSES_TO_TARGETS_NODE(
                PERCENTAGE_NODE(15, UNITS_SPD_AT_START_OF_COMBAT_NODE),
            ),
            X_NUM_NODE(
                // unit deals X × 8 damage (excluding area-of-effect Specials),
                DEALS_DAMAGE_X_NODE(MULT_NODE(READ_NUM_NODE, 8)),
                // and reduces damage from foe's first attack by X × 6 during combat
                REDUCES_DAMAGE_FROM_FOES_FIRST_ATTACK_BY_N_DURING_COMBAT_INCLUDING_TWICE_NODE(MULT_NODE(READ_NUM_NODE, 6)),
                // (X = number of foes within 3 spaces of target, including target; max 4;
                // "first attack" normally means only the first strike;
                // for effects that grant "unit attacks twice," it means the first and second strikes).
                ENSURE_MAX_NODE(NUM_OF_TARGETS_FOES_WITHIN_3_SPACES_OF_TARGET_NODE, 4),
            ),
        ),
    ));
    // At start of turn,
    // if unit is adjacent to only beast or dragon allies
    // or if unit is not adjacent to any ally,
    // unit transforms (otherwise, unit reverts).
    // If unit transforms,
    // grants Atk+2 and unit can move 1 extra space (that turn only; does not stack).
    setBeastSkill(skillId, BeastCommonSkillType.Flying);
}

// New Opening
{
    let skillId = PassiveA.NewOpening;
    // If unit can transform,
    // transformation effects gain
    // "if unit is within 2 spaces of a beast or dragon ally,
    // or if number of adjacent allies other than beast or dragon allies ≤ 2"
    // as a trigger condition (in addition to existing conditions).
    setEffectThatTransformationEffectsGainAdditionalTriggerCondition(skillId);

    // If defending in Aether Raids,
    // at the start of enemy turn 1,
    // if conditions for transforming are met,
    // unit transforms.
    setEffectThatIfDefendingInARAtStartOfEnemyTurn1UnitTransforms(skillId);

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // If unit is transformed
        // or if foe's HP ≥ 75% at start of combat,
        IF_NODE(OR_NODE(IS_TARGET_TRANSFORMED_NODE, IS_FOES_HP_GTE_75_PERCENT_AT_START_OF_COMBAT_NODE),
            // grants Atk/Spd/Def/Res+9 to unit,
            GRANTS_ALL_BONUSES_TO_TARGETS_NODE(9),
            // neutralizes effects that inflict "Special cooldown charge -X" on unit,
            NEUTRALIZES_EFFECTS_THAT_INFLICT_SPECIAL_COOLDOWN_CHARGE_MINUS_X_ON_UNIT,
            X_NUM_NODE(
                // unit deals +X damage (excluding area-of-effect Specials),
                DEALS_DAMAGE_X_NODE(READ_NUM_NODE),
                // reduces damage from foe's first attack by X during combat
                // ("first attack" normally means only the first strike;
                // for effects that grant "unit attacks twice," it means the first and second strikes),
                REDUCES_DAMAGE_FROM_FOES_FIRST_ATTACK_BY_N_DURING_COMBAT_INCLUDING_TWICE_NODE(READ_NUM_NODE),
                // reduces damage from foe's Specials by an additional X
                REDUCES_DAMAGE_WHEN_FOES_SPECIAL_EXCLUDING_AOE_SPECIAL_NODE(READ_NUM_NODE),
                // (excluding area-of-effect Specials;
                // X = number of spaces from start position to end position of whoever initiated combat × 4; max 12),
                MULT_MAX_NODE(NUMBER_OF_SPACES_FROM_START_POSITION_TO_END_POSITION_OF_WHOEVER_INITIATED_COMBAT, 4, 12),
            ),
            // and restores 7 HP to unit after combat.
            RESTORES_7_HP_TO_UNIT_AFTER_COMBAT_NODE,
        ),
    ));
}

// Preempt Screech
{
    let skillId = PassiveC.PreemptScreech;
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // Inflicts Spd/Def-4 on foe,
        INFLICTS_SPD_DEF_ON_FOE_DURING_COMBAT_NODE(4),
        // disables skills of all foes, excluding foe in combat,
        UNIT_DISABLES_SKILLS_OF_ALL_OTHERS_IN_COMBAT_EXCLUDING_UNIT_AND_FOE_NODE,
        // and grants Special cooldown count-1 to unit before unit's first attack during combat.
        GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_N_TO_TARGET_BEFORE_TARGETS_FIRST_ATTACK_DURING_COMBAT_NODE(1),
    ));
}

// Sword of Peace
{
    let skillId = Weapon.SwordOfPeace;
    // Mt: 16
    // Rng: 1
    // Accelerates Special trigger (cooldown count-1).
    setAllEffectsForSkillOwnersAlliesDuringCombatHooks(skillId,
        // For allies within 3 spaces of unit,
        IS_TARGET_WITHIN_3_SPACES_OF_SKILL_OWNER_NODE,
        // grants Atk/Spd+5
        GRANTS_ATK_SPD_TO_TARGET_DURING_COMBAT_NODE(5),
        SKILL_EFFECT_NODE(
            // and grants Special cooldown count-1 to ally before ally's first attack during combat,
            GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_N_TO_TARGET_BEFORE_TARGETS_FIRST_ATTACK_DURING_COMBAT_NODE(1),
            // and restores 10 HP to those allies after their combat.
            RESTORES_7_HP_TO_UNIT_AFTER_COMBAT_NODE,
        ),
    );
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // If unit is within 3 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_TARGETS_ALLY_NODE,
            // grants bonus to unit's Atk/Spd/Def/Res
            GRANTS_ALL_BONUSES_TO_TARGETS_NODE(
                // = number of allies within 3 rows or 3 columns centered on unit × 3, +5 (max 14),
                MULT_ADD_MAX_NODE(NUM_OF_ALLIES_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_UNIT_NODE, 3, 5, 14),
            ),
            X_NUM_NODE(
                // unit deals +X damage (excluding area-of-effect Specials),
                DEALS_DAMAGE_X_NODE(READ_NUM_NODE),
                // reduces damage from foe's first attack by 50% of X during combat
                // ("first attack" normally means only the first strike;
                // for effects that grant "unit attacks twice," it means the first and second strikes),
                REDUCES_DAMAGE_FROM_FOES_FIRST_ATTACK_BY_N_DURING_COMBAT_INCLUDING_TWICE_NODE(
                    PERCENTAGE_NODE(50, READ_NUM_NODE)),
                // reduces damage from foe's Specials by an additional 50% of X
                // (excluding area-of-effect Specials;
                REDUCES_DAMAGE_WHEN_FOES_SPECIAL_EXCLUDING_AOE_SPECIAL_NODE(
                    PERCENTAGE_NODE(50, READ_NUM_NODE),
                ),
                // X = highest total bonuses among unit and allies within 3 spaces of unit),
                HIGHEST_TOTAL_BONUSES_AMONG_UNIT_AND_ALLIES_WITHIN_N_SPACES_NODE(3),
            ),
            // grants Special cooldown count-1 to unit before unit's first attack,
            GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_N_TO_TARGET_BEFORE_TARGETS_FIRST_ATTACK_DURING_COMBAT_NODE(1),
            // reduces the percentage of foe's non-Special "reduce damage by X%" skills by 50% during combat
            // (excluding area-of-effect Specials),
            REDUCES_PERCENTAGE_OF_TARGETS_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE,
            // and restores 10 HP to unit after combat.
            RESTORES_10_HP_TO_UNIT_AFTER_COMBAT_NODE,
        ),
    ));
}

// The Fire Emblem
{
    let skillId = Special.TheFireEmblem;
    setSpecialCount(skillId, 2);
    NORMAL_ATTACK_SPECIAL_SET.add(skillId);
    WHEN_APPLIES_SPECIAL_EFFECTS_AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // Boosts damage by 40% of unit's Spd when Special triggers.
        BOOSTS_DAMAGE_WHEN_SPECIAL_TRIGGERS_NODE(PERCENTAGE_NODE(40, UNITS_SPD_NODE)),
    ));
    let nodeFunc = () => SKILL_EFFECT_NODE(
        // if unit is within 2 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_2_SPACES_OF_TARGETS_ALLY_NODE,
            // to unit and allies within 2 spaces of unit for 1 turn.
            FOR_EACH_TARGET_AND_TARGETS_ALLY_WITHIN_2_SPACES_OF_TARGET_NODE(
                // grants Atk/Spd/Def/Res+7
                GRANTS_ALL_BONUSES_TO_TARGET_ON_MAP_NODE(7),
                // (Fire Emblem),
                GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.FireEmblem),
                // and (Null Panic)
                GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.NullPanic),
            ),
        ),
    );
    // At start of player phase or enemy phase,
    AT_START_OF_TURN_HOOKS.addSkill(skillId, nodeFunc);
    AT_START_OF_ENEMY_PHASE_HOOKS.addSkill(skillId, nodeFunc);

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // Reduces damage from foe's attacks by X% during combat
        // (excluding area-of-effect Specials;
        REDUCES_DAMAGE_FROM_TARGETS_FOES_ATTACKS_BY_X_PERCENT_BY_SPECIAL_NODE(
            // X = number of allies on the map with the (Fire Emblem) effect active, including unit, ×10; max 40%).
            MULT_MAX_NODE(
                COUNT_IF_UNITS_NODE(TARGET_AND_TARGETS_ALLIES_ON_MAP_NODE,
                    HAS_TARGET_STATUS_EFFECT_NODE(StatusEffectType.FireEmblem)), 10, 40),
        ),
        // Unit can counterattack regardless of foe's range.
        TARGET_CAN_COUNTERATTACK_REGARDLESS_OF_RANGE_NODE,
    ));
}

// [Fire Emblem]
{
    let skillId = getStatusEffectSkillId(StatusEffectType.FireEmblem);
    // TODO: 順位
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // Neutralizes "effective against" bonuses for all movement types.
        TARGET_NEUTRALIZES_EFFECTIVE_AGAINST_X_NODE(EffectiveType.Infantry),
        TARGET_NEUTRALIZES_EFFECTIVE_AGAINST_X_NODE(EffectiveType.Armor),
        TARGET_NEUTRALIZES_EFFECTIVE_AGAINST_X_NODE(EffectiveType.Cavalry),
        TARGET_NEUTRALIZES_EFFECTIVE_AGAINST_X_NODE(EffectiveType.Flying),
    ));
    WHEN_APPLIES_EFFECTS_TO_STATS_AFTER_COMBAT_STATS_DETERMINED_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // Grants bonus to unit's Atk/Spd/Def/Res
        FOR_EACH_STAT_INDEX_NODE(
            // = highest bonus on each stat between unit and allies within 2 spaces of unit
            // (calculates each stat bonus independently)
            GRANTS_STAT_PLUS_TO_TARGET_DURING_COMBAT_NODE(
                GET_STAT_AT_NODE(
                    HIGHEST_BONUS_ON_EACH_STAT_BETWEEN_TARGET_AND_TARGET_ALLIES_WITHIN_N_SPACES_NODE(2),
                    READ_NUM_NODE,
                ),
                READ_NUM_NODE,
            ),
        ),
        // and reduces damage from foe's first attack by 10 during combat
        // ("first attack" normally means only the first strike;
        // for effects that grant "unit attacks twice," it means the first and second strikes).
        REDUCES_DAMAGE_FROM_FOES_FIRST_ATTACK_BY_N_DURING_COMBAT_INCLUDING_TWICE_NODE(10),
    ));
}

// Shield of Hope
{
    let skillId = PassiveB.ShieldOfHope;
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // Inflicts Atk/Spd/Def-5 on foe,
        INFLICTS_ATK_SPD_DEF_ON_FOE_DURING_COMBAT_NODE(5),
        // neutralizes effects that guarantee foe's follow-up attacks
        // and effects that prevent unit's follow-up attacks,
        NULL_UNIT_FOLLOW_UP_NODE,
        // and grants effects based on the total value of bonuses
        X_NUM_NODE(
            // If value ≥ 20,
            IF_NODE(GTE_NODE(READ_NUM_NODE, 20),
                // if decreasing the Spd difference necessary to make a follow-up attack by 10
                // would allow unit to trigger a follow-up attack
                // (excluding guaranteed or prevented follow-ups),
                // triggers (Potent Follow 100%).
                POTENT_FOLLOW_N_PERCENT_NODE(100, -10, true),
            ),
            // If value ≥ 40,
            IF_NODE(GTE_NODE(READ_NUM_NODE, 40),
                // if foe initiates combat,
                IF_NODE(DOES_FOE_INITIATE_COMBAT_NODE,
                    // unit can counterattack before foe's first attack.
                    TARGET_CAN_COUNTERATTACK_BEFORE_TARGETS_FOES_FIRST_ATTACK_NODE,
                ),
            ),
            // If value ≥ 60,
            IF_NODE(GTE_NODE(READ_NUM_NODE, 60),
                // neutralizes effects that prevent unit's counterattacks,
                NEUTRALIZES_EFFECTS_THAT_PREVENT_TARGETS_COUNTERATTACKS_DURING_COMBAT_NODE,
                // and also, if it is first combat initiated by foe that turn,
                IF_NODE(IS_IT_FIRST_COMBAT_INITIATED_BY_TARGETS_FOE_IN_PLAYER_PHASE_OR_ENEMY_PHASE_NODE,
                    // unit can make a follow-up attack before foe's next attack.
                    UNIT_CAN_MAKE_FOLLOW_UP_ATTACK_BEFORE_FOES_NEXT_ATTACK_NODE,
                ),
            ),
            // on the 3 allies with the highest bonus totals during combat (excluding unit):
            SUM_NUMBERS_NODE(TOP_N_NODE(3, TOTAL_BONUSES_LIST_OF_TARGETS_ALLIES_ON_MAP_NODE)),
        ),
    ));
}

// S/D Hold Guide
{
    let skillId = PassiveC.SDHoldGuide;
    // Allies within 2 spaces of unit
    // can move to any space within 2 spaces of unit.
    setSkillThatUnitCanMoveToAnySpaceWithinNSpacesOfAnAllyWithinMSpacesOfUnit(skillId, 2, 2);
    // Unit can move to a space
    // within 2 spaces of any ally within 2 spaces.
    setSkillThatAlliesWithinNSpacesOfUnitCanMoveToAnySpaceWithinMSpacesOfUnit(skillId, 2, 2);
    WHEN_INFLICTS_STATS_MINUS_TO_FOES_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // on foes within 3 spaces of unit during combat.
        IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_SKILL_OWNER_NODE,
            // Inflicts Spd/Def-4
            INFLICTS_SPD_DEF_ON_FOE_DURING_COMBAT_NODE(4),
        ),
    ));
}

// Duo Skill
{
    let skillId = getDuoOrHarmonizedSkillId(Hero.DuoMarth);
    let maxUnitsNode =
        // to ally with the highest HP
        // that is within 2 spaces of unit and has already acted (excluding unit)
        MAX_UNITS_NODE(
            FILTER_UNITS_NODE(TARGETS_ALLIES_WITHIN_2_SPACES_NODE(), HAS_TARGET_PERFORMED_ACTION_NODE),
            TARGETS_HP_ON_MAP_NODE);
    // TODO: リファクタリング
    CAN_TRIGGER_DUO_OR_HARMONIZED_EFFECT_HOOKS_MAP.addValue(Hero.DuoMarth,
        EQ_NODE(COUNT_UNITS_NODE(maxUnitsNode), 1)
    );
    WHEN_TRIGGERS_DUO_OR_HARMONIZED_EFFECT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        IF_NODE(
            // (If multiple allies meet the above conditions, effect will not trigger.)
            EQ_NODE(COUNT_UNITS_NODE(maxUnitsNode), 1),
            FOR_EACH_UNIT_NODE(maxUnitsNode,
                // Grants another action
                GRANTS_ANOTHER_ACTION_TO_TARGET_ON_MAP_NODE,
                // and grants [Potent Follow] and "neutralizes foe's bonuses during combat" to that ally for 1 turn.
                GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(
                    StatusEffectType.PotentFollow,
                    StatusEffectType.NeutralizesFoesBonusesDuringCombat),
            ),
        ),
    ));
}

// Ancient Trickery
{
    let skillId = Weapon.AncientTrickery;
    // Grants HP+5.
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // At start of turn,
        // if unit's HP ≥ 25%,
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_TURN_NODE(
            // on closest foes and any foes within 2 spaces of those foes through their next actions.
            FOR_EACH_TARGETS_CLOSEST_FOE_AND_ANY_FOE_WITHIN_2_SPACES_OF_THOSE_FOES_NODE(
                // inflicts Spd/Res-7 and【Sabotage】
                INFLICTS_SPD_RES_ON_TARGET_ON_MAP_NODE(7),
                INFLICTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.Sabotage),
            ),
        ),
    ));
    setAtStartOfCombatAndAfterStatsDeterminedHooks(skillId,
        // At start of combat,
        // if unit's HP ≥ 25%,
        IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE,
        SKILL_EFFECT_NODE(
            // grants bonus to unit's Atk/Spd/Def/Res =
            GRANTS_ALL_BONUSES_TO_TARGETS_NODE(
                // 25% of foe's Atk at start of combat - 4 (max 14; min 5),
                ENSURE_MAX_MIN_NODE(SUB_NODE(PERCENTAGE_NODE(25, FOES_ATK_NODE), 4), 14, 5),
            ),
        ),
        SKILL_EFFECT_NODE(
            FOR_EACH_STAT_INDEX_NODE(
                // grants bonus to unit's Atk/Spd/Def/Res =
                GRANTS_OR_INFLICTS_TARGETS_STAT_DURING_COMBAT_NODE(READ_NUM_NODE,
                    // highest respective stat from among allies within 3 spaces - unit's stat values
                    // (calculates each stat bonus independently at start of combat; if unit's stat is highest, unit's stat will decrease),
                    SUB_NODE(
                        HIGHEST_STAT_ON_EACH_STAT_BETWEEN_TARGET_ALLIES_WITHIN_N_SPACES_NODE(READ_NUM_NODE, 3),
                        UNITS_STAT_AT_START_OF_COMBAT_NODE(READ_NUM_NODE),
                    ),
                ),
            ),
            // deals damage = 20% of unit's Spd (excluding area-of-effect Specials), and
            DEALS_DAMAGE_X_PERCENTAGE_OF_UNITS_STAT_NODE(STATUS_INDEX.Spd, 20),
            // reduces damage from foe's first attack by 7 during combat
            // ("first attack" normally means only the first strike; for effects that grant "unit attacks twice," it means the first and second strikes).
            REDUCES_DAMAGE_FROM_FOES_FIRST_ATTACK_BY_N_DURING_COMBAT_INCLUDING_TWICE_NODE(7),
        ),
    );
}

// Ancient Majesty
{
    let skillId = Weapon.AncientMajesty;
    // Mt: 16  Rng: 1  Effect: [Red, Blue, Green, Colorless]
    // Accelerates Special trigger (cooldown count -1).
    // Effective against dragon foes.
    // If foe’s Range = 2, calculates damage using the lower of foe’s Def or Res.
    let nodeFunc = () => SKILL_EFFECT_NODE(
        // At start of player phase or enemy phase, if unit’s HP ≥ 25%,
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_TURN_NODE(
            // on closest foes and any foes within 2 spaces of those foes through their next actions.
            FOR_EACH_TARGETS_CLOSEST_FOE_AND_ANY_FOE_WITHIN_2_SPACES_OF_THOSE_FOES_NODE(
                // inflicts Atk/Res-7, [Frozen], and [Guard]
                INFLICTS_ATK_RES_ON_TARGET_ON_MAP_NODE(7),
                INFLICTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.Frozen, StatusEffectType.Guard),
            ),
        ),
    );
    AT_START_OF_TURN_HOOKS.addSkill(skillId, nodeFunc);
    AT_START_OF_ENEMY_PHASE_HOOKS.addSkill(skillId, nodeFunc);
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // At start of combat, if unit’s HP ≥ 25%,
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE(
            // grants bonus to unit’s Atk/Spd/Def/Res =
            GRANTS_ALL_BONUSES_TO_TARGETS_NODE(
                // number of allies within 3 rows or 3 columns centered on unit × 3 + 5 (max 14),
                ENSURE_MAX_NODE(
                    ADD_NODE(MULT_NODE(NUM_OF_ALLIES_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_UNIT_NODE, 3), 5),
                    14
                ),
            ),
            // deals damage = 15% of foe’s Atk (excluding area-of-effect Specials),
            APPLY_SKILL_EFFECTS_AFTER_STATUS_FIXED_NODE(
                UNIT_DEALS_DAMAGE_EXCLUDING_AOE_SPECIALS_NODE(PERCENTAGE_NODE(15, FOES_ATK_DURING_COMBAT_NODE)),
            ),
            // and reduces the percentage of foe’s non-Special “reduce damage by X%” skills by 50% during combat (excluding area-of-effect Specials).
            REDUCES_PERCENTAGE_OF_TARGETS_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE,
        ),
    ));
}

// Divine God Fang (C Slot)
{
    let skillId = PassiveC.DivineGodFang;
    // Allies within 2 spaces of unit can move to any space within 2 spaces of unit.
    setSkillThatAlliesWithinNSpacesOfUnitCanMoveToAnySpaceWithinMSpacesOfUnit(skillId, 2, 2);
    let nodeFunc = () => SKILL_EFFECT_NODE(
        // if unit is within 2 spaces of an ally, grants:
        IF_NODE(IS_TARGET_WITHIN_2_SPACES_OF_TARGETS_ALLY_NODE,
            // to unit and allies within 2 spaces of unit for 1 turn.
            FOR_EACH_TARGET_AND_TARGETS_ALLY_WITHIN_2_SPACES_OF_TARGET_NODE(
                // 	•	“effective against dragons,”
                GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.EffectiveAgainstDragons),
                // 	•	“neutralizes ‘effective against dragons’ bonuses,”
                GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.ShieldDragon),
                // 	•	[Empathy]
                GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.Empathy),
            ),
        ),
    );
    // At start of player phase or enemy phase,
    AT_START_OF_TURN_HOOKS.addSkill(skillId, nodeFunc);
    AT_START_OF_ENEMY_PHASE_HOOKS.addSkill(skillId, nodeFunc);
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // If unit is within 3 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_TARGETS_ALLY_NODE,
            // grants Atk/Spd/Def/Res+5 to unit,
            GRANTS_ALL_STATS_PLUS_5_TO_TARGET_DURING_COMBAT_NODE,
            // unit deals +7 damage (excluding area-of-effect Specials),
            UNIT_DEALS_DAMAGE_EXCLUDING_AOE_SPECIALS_NODE(7),
            // reduces damage from foe’s attacks by 7 (excluding area-of-effect Specials),
            REDUCES_DAMAGE_FROM_TARGETS_FOES_ATTACKS_BY_X_DURING_COMBAT_NODE(7),
            // and grants Special cooldown charge +1 to unit per attack during combat
            // (only highest value applied; does not stack).
            GRANTS_SPECIAL_COOLDOWN_CHARGE_PLUS_1_TO_UNIT_PER_ATTACK_DURING_COMBAT_NODE,
        ),
    ));
}

// Fundament
{
    let skillId = Weapon.Fundament;
    // Mt: 14  Rng: 2
    // Accelerates Special trigger (cooldown count -1).
    //
    let nodeFunc = () => SKILL_EFFECT_NODE(
        // At start of player phase or enemy phase, if unit’s HP ≥ 25%,
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_TURN_NODE(
            // to unit and allies within 2 spaces of unit for 1 turn.
            FOR_EACH_TARGET_AND_TARGETS_ALLY_WITHIN_2_SPACES_OF_TARGET_NODE(
                // grants Atk/Res+6,
                GRANTS_ATK_RES_TO_TARGET_ON_MAP_NODE(6),
                // “reduces damage from area-of-effect Specials by 80% (excluding Røkkr area-of-effect Specials),”
                GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.ReduceDamageFromAreaOfEffectSpecialsBy80Percent),
                // and “neutralizes foe’s bonuses during combat”
                GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.NeutralizesFoesBonusesDuringCombat),
            ),
        ),
    );
    AT_START_OF_TURN_HOOKS.addSkill(skillId, nodeFunc);
    AT_START_OF_ENEMY_PHASE_HOOKS.addSkill(skillId, nodeFunc);
    let [dealsDamageAoe, dealsDamageDuringCombat] =
        DEALS_DAMAGE_PERCENTAGE_OF_TARGETS_STAT_NODES(STATUS_INDEX.Res, 20);
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // At start of combat, if unit’s HP ≥ 25%,
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE(
            // inflicts penalty on foe’s Atk/Res = 20% of unit’s Res at start of combat + 6,
            X_NUM_NODE(
                INFLICTS_ATK_RES_ON_FOE_DURING_COMBAT_NODE(READ_NUM_NODE),
                ADD_NODE(PERCENTAGE_NODE(20, UNITS_RES_AT_START_OF_COMBAT_NODE), 6),
            ),
            // deals damage = 20% of unit’s Res (including area-of-effect Specials),
            dealsDamageDuringCombat,
            APPLY_SKILL_EFFECTS_AFTER_STATUS_FIXED_NODE(
                // reduces damage from foe’s attacks by 20% of unit’s Res (excluding area-of-effect Specials),
                REDUCES_DAMAGE_FROM_TARGETS_FOES_ATTACKS_BY_X_DURING_COMBAT_NODE(
                    PERCENTAGE_NODE(20, UNITS_RES_DURING_COMBAT_NODE)),
            ),
            // unit makes a guaranteed follow-up attack during combat,
            UNIT_MAKES_GUARANTEED_FOLLOW_UP_ATTACK_NODE,
            // and restores 7 HP to unit after combat.
            RESTORES_7_HP_TO_UNIT_AFTER_COMBAT_NODE,
        ),
    ));
    // deals damage = 20% of unit’s Res (including area-of-effect Specials),
    BEFORE_AOE_SPECIAL_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE(
            dealsDamageAoe,
        ),
    ));
}

// Gift of Guidance (A Slot)
{
    let skillId = PassiveA.GiftOfGuidance;
    // Grants Atk/Def/Res+10.
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // At start of turn, if unit’s HP ≥ 25%,
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_TURN_NODE(
            // grants Special cooldown count -2 to unit,
            GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_ON_TARGET_ON_MAP_NODE(2),
            // to allies within 2 spaces of unit.
            FOR_EACH_TARGETS_ALLY_WITHIN_2_SPACES_NODE(
                // and grants Special cooldown count -1
                GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_ON_TARGET_ON_MAP_NODE(1),
                // If those allies are magic or staff allies, grants an additional Special cooldown count -1 to those allies.
                IF_NODE(OR_NODE(IS_TARGET_MAGIC_TYPE_NODE, IS_TARGET_STAFF_TYPE_NODE),
                    GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_ON_TARGET_ON_MAP_NODE(1),
                ),
            ),
        ),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // At start of combat, if unit’s HP ≥ 25%,
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE(
            // neutralizes penalties on unit,
            NEUTRALIZES_PENALTIES_ON_UNIT_NODE,
            // inflicts Special cooldown charge -1 on foe per attack (only highest value applied; does not stack),
            INFLICTS_SPECIAL_COOLDOWN_CHARGE_MINUS_1_ON_FOE_NODE,
            // and reduces the percentage of foe’s non-Special “reduce damage by X%” skills by 50% during combat (excluding area-of-effect Specials).
            REDUCES_PERCENTAGE_OF_TARGETS_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE,
        ),
    ));
}

// Atk/Res Havoc (B Slot)
{
    let skillId = PassiveB.AtkResHavoc;
    // At start of player phase or enemy phase,
    let nodeFunc = () => SKILL_EFFECT_NODE(
        // inflicts Atk/Res-7, [Sabotage], and [Schism] on foes with Res < unit’s Res
        // and that are within 2 spaces of another foe through their next actions.
        FOR_EACH_UNIT_NODE(
            FILTER_UNITS_NODE(
                TARGETS_FOES_THAT_ARE_WITHIN_N_SPACES_OF_ANOTHER_TARGETS_FOE_NODE(2),
                LT_NODE(TARGETS_EVAL_RES_ON_MAP, SKILL_OWNERS_EVAL_RES_ON_MAP),
            ),
            INFLICTS_ATK_DEF_ON_TARGET_ON_MAP_NODE(7),
            INFLICTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.Sabotage, StatusEffectType.Schism),
        ),
    );
    AT_START_OF_TURN_HOOKS.addSkill(skillId, nodeFunc);
    AT_START_OF_ENEMY_PHASE_HOOKS.addSkill(skillId, nodeFunc);
    // After start-of-turn skills trigger on unit’s player phase,
    AFTER_START_OF_TURN_EFFECTS_TRIGGER_ON_PLAYER_PHASE_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        IF_NODE(
            // if the number of foes with the [Sabotage] effect active on the map is 2 or more,
            GTE_NODE(
                COUNT_IF_UNITS_NODE(TARGETS_FOES_ON_MAP_NODE, HAS_TARGET_STATUS_EFFECT_NODE(StatusEffectType.Sabotage)),
                2
            ),
            // grants [Canto (1)] to unit for 1 turn.
            GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.Canto1),
        ),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // Inflicts Atk/Res-4 on foe and
        INFLICTS_ATK_RES_ON_FOE_DURING_COMBAT_NODE(4),
        // deals damage = 20% of unit’s Res during combat (excluding area-of-effect Specials).
        DEALS_DAMAGE_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS(20, UNITS_RES_DURING_COMBAT_NODE),
    ));
}

// Ancient Betrayal
{
    let skillId = Weapon.AncientBetrayal;
    // Mt: 16  Rng: 1
    // Grants Atk+3.
    // If foe’s Range = 2, calculates damage using the lower of foe’s Def or Res.
    let nodeFunc = () => SKILL_EFFECT_NODE(
        // At start of player phase or enemy phase, if unit’s HP ≥ 25%,
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_TURN_NODE(
            // to unit and allies within 2 spaces of unit for 1 turn.
            FOR_EACH_TARGET_AND_TARGETS_ALLY_WITHIN_2_SPACES_OF_TARGET_NODE(
                // grants Atk/Res+6,
                GRANTS_ATK_RES_TO_TARGET_ON_MAP_NODE(6),
                // [En Garde], and
                // “neutralizes foe’s bonuses during combat”
                GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(
                    StatusEffectType.EnGarde,
                    StatusEffectType.NeutralizesFoesBonusesDuringCombat),
            ),
        ),
    );
    AT_START_OF_TURN_HOOKS.addSkill(skillId, nodeFunc);
    AT_START_OF_ENEMY_PHASE_HOOKS.addSkill(skillId, nodeFunc);
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // At start of combat, if unit’s HP ≥ 25%,
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE(
            X_NUM_NODE(
                // inflicts penalty on foe’s Atk/Def/Res =
                INFLICTS_ATK_DEF_RES_ON_FOE_DURING_COMBAT_NODE(READ_NUM_NODE),
                // 20% of unit’s Res at start of combat + 5,
                ADD_NODE(PERCENTAGE_NODE(20, UNITS_RES_AT_START_OF_COMBAT_NODE), 5),
            ),
            X_NUM_NODE(
                // unit deals +X damage (excluding area-of-effect Specials),
                UNIT_DEALS_DAMAGE_EXCLUDING_AOE_SPECIALS_NODE(READ_NUM_NODE),
                // reduces damage from foe’s attacks by X (excluding area-of-effect Specials;
                REDUCES_DAMAGE_FROM_TARGETS_FOES_ATTACKS_BY_X_DURING_COMBAT_NODE(READ_NUM_NODE),
                // X = number of staff and dragon allies on the map, excluding unit, × 5 + 10; max 20),
                MULT_ADD_MAX_NODE(
                    COUNT_IF_UNITS_NODE(
                        TARGETS_ALLIES_ON_MAP_NODE,
                        OR_NODE(IS_TARGET_STAFF_TYPE_NODE, IS_TARGET_DRAGON_TYPE_NODE),
                    ),
                    5, 10, 20
                ),
            ),
            APPLY_SKILL_EFFECTS_AFTER_STATUS_FIXED_NODE(
                // and also, if foe’s attack can trigger foe’s Special and unit’s Res ≥ foe’s Res + 5,
                IF_NODE(
                    AND_NODE(
                        CAN_FOES_ATTACK_TRIGGER_FOES_SPECIAL_NODE,
                        LT_NODE(UNITS_EVAL_RES_DURING_COMBAT_NODE, ADD_NODE(FOES_EVAL_RES_DURING_COMBAT_NODE, 5)),
                    ),
                    // inflicts Special cooldown count +1 on foe before foe’s first attack during combat
                    // (cannot exceed foe’s maximum Special cooldown).
                    INFLICTS_SPECIAL_COOLDOWN_COUNT_PLUS_N_ON_TARGETS_FOE_BEFORE_TARGETS_FOES_FIRST_ATTACK_NODE(1),
                ),
            ),
        ),
    ));
}

// Ancient Voice
{
    let skillId = Weapon.AncientVoice;
    // Mt: 16  Rng: 1  Effect: [Red, Blue, Green, Colorless]
    // Accelerates Special trigger (cooldown count -1).
    // If foe’s Range = 2, calculates damage using the lower of foe’s Def or Res.
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // At start of turn, if unit is within 2 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_2_SPACES_OF_TARGETS_ALLY_NODE,
            // to unit and allies within 2 spaces of unit for 1 turn.
            FOR_EACH_TARGET_AND_TARGETS_ALLY_WITHIN_2_SPACES_OF_TARGET_NODE(
                // grants Spd/Def+6, [Bulwark],
                GRANTS_SPD_DEF_TO_TARGET_ON_MAP_NODE(6),
                GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.Bulwark),
                // and “neutralizes penalties on unit during combat”
                GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.NeutralizesPenalties),
            ),
        ),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // Effective against dragon foes.
        EFFECTIVE_AGAINST_NODE(EffectiveType.Dragon),
    ));
    setAtStartOfCombatAndAfterStatsDeterminedHooks(skillId,
        IS_TARGET_WITHIN_3_SPACES_OF_TARGETS_ALLY_NODE,
        SKILL_EFFECT_NODE(
            // calculates damage using 150% of unit’s Def instead of unit’s Atk when Special triggers (excluding area-of-effect Specials).
            CALCULATES_DAMAGE_USING_X_PERCENT_OF_TARGETS_STAT_INSTEAD_OF_ATK_WHEN_SPECIAL_NODE(STATUS_INDEX.Def, 150),
            X_NUM_NODE(
                // grants bonus to unit’s Atk/Spd/Def/Res =
                GRANTS_ALL_BONUSES_TO_TARGETS_NODE(READ_NUM_NODE),
                // number of allies within 3 spaces of unit × 3 + 5 (max 14),
                MULT_ADD_MAX_NODE(NUM_OF_TARGETS_ALLIES_WITHIN_3_SPACES_NODE, 3, 5, 14),
            ),
        ),
        SKILL_EFFECT_NODE(
            // deals damage = 20% of unit’s Def (excluding area-of-effect Specials),
            DEALS_DAMAGE_X_PERCENTAGE_OF_UNITS_STAT_NODE(STATUS_INDEX.Def, 20),
            // reduces damage from foe’s first attack by 20% of unit’s Def during combat
            // (“first attack” normally means only the first strike; for effects that grant “unit attacks twice,” it means the first and second strikes),
            REDUCES_DAMAGE_FROM_FOES_FIRST_ATTACK_BY_N_DURING_COMBAT_INCLUDING_TWICE_NODE(
                PERCENTAGE_NODE(20, UNITS_DEF_NODE),
            ),
            // and also, if unit’s Def > foe’s Def + 5,
            IF_NODE(GT_NODE(UNITS_DEF_DURING_COMBAT_NODE, ADD_NODE(FOES_DEF_DURING_COMBAT_NODE, 5)),
                // disables unit’s and foe’s skills that change attack priority during combat.
                UNIT_DISABLES_SKILLS_THAT_CHANGE_ATTACK_PRIORITY,
                FOE_DISABLES_SKILLS_THAT_CHANGE_ATTACK_PRIORITY,
            ),
        ),
    );
}

// Dragon Flame (Special, Cooldown: 4)
{
    let skillId = Special.DragonFlame;
    WHEN_APPLIES_SPECIAL_EFFECTS_AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // Boosts damage by 80% of unit’s Def and restores 30% of unit’s maximum HP when Special triggers.
        BOOSTS_DAMAGE_WHEN_SPECIAL_TRIGGERS_NODE(PERCENTAGE_NODE(80, UNITS_DEF_NODE)),
        RESTORES_X_PERCENTAGE_OF_TARGETS_MAXIMUM_HP_NODE(30),
    ));
    AT_APPLYING_ONCE_PER_COMBAT_DAMAGE_REDUCTION_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // If both of the following conditions are met,
        IF_NODE(
            AND_NODE(
                // 	•	Unit’s or foe’s Special is ready, or triggered before or during this combat.
                IF_UNITS_OR_FOES_SPECIAL_IS_READY_OR_UNITS_OR_FOES_SPECIAL_TRIGGERED_BEFORE_OR_DURING_COMBAT_NODE,
                // 	•	Foe initiates combat or unit’s Def ≥ foe’s Def + 10.
                OR_NODE(
                    DOES_FOE_INITIATE_COMBAT_NODE,
                    GTE_NODE(UNITS_EVAL_DEF_DURING_COMBAT_NODE, ADD_NODE(FOES_EVAL_DEF_DURING_COMBAT_NODE, 10))),
            ),
            // reduces damage from foe’s next attack by 40% during combat:
            REDUCES_DAMAGE_FROM_TARGETS_FOES_NEXT_ATTACK_BY_N_PERCENT_ONCE_PER_COMBAT_NODE(40),
        ),
        // (Once per combat; excluding area-of-effect Specials.)
    ));
}

// Love for All! (C Slot)
{
    let skillId = PassiveC.LoveForAll;
    // For allies within 3 spaces of unit,
    setAllEffectsForSkillOwnersAlliesDuringCombatHooks(skillId,
        IS_TARGET_WITHIN_3_SPACES_OF_SKILL_OWNER_NODE,
        // grants Atk/Spd/Def/Res+5 and
        GRANTS_ALL_STATS_PLUS_5_TO_TARGET_DURING_COMBAT_NODE,
        // grants Special cooldown count -1 before foe’s first attack during combat.
        GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_N_TO_TARGET_BEFORE_TARGETS_FOES_FIRST_ATTACK_DURING_COMBAT_NODE(1),
    );
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // If unit is within 3 spaces of an ally:
        IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_TARGETS_ALLY_NODE,
            // 	•	Grants Atk/Spd/Def/Res+5 to unit
            GRANTS_ALL_STATS_PLUS_5_TO_TARGET_DURING_COMBAT_NODE,
            X_NUM_NODE(
                // 	•	Reduces damage from foe’s first attack by X × 7 (max 14)
                // (“first attack” normally means only the first strike; for effects that grant “unit attacks twice,” it means the first and second strikes)
                REDUCES_DAMAGE_FROM_FOES_FIRST_ATTACK_BY_N_DURING_COMBAT_INCLUDING_TWICE_NODE(
                    MULT_MAX_NODE(READ_NUM_NODE, 7, 14)
                ),
                // 	•	Grants Special cooldown count -X to unit before foe’s first attack during combat
                // 	(max 3;
                GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_N_TO_TARGET_BEFORE_TARGETS_FOES_FIRST_ATTACK_DURING_COMBAT_NODE(
                    ENSURE_MAX_NODE(READ_NUM_NODE, 3),
                ),
                // 	X = number of allies within 3 spaces of unit)
                NUM_OF_TARGETS_ALLIES_WITHIN_3_SPACES_NODE,
            ),
            // 	•	When unit’s Special triggers, neutralizes foe’s “reduces damage by X%” effects from foe’s non-Special skills (excluding area-of-effect Specials)
            WHEN_SPECIAL_TRIGGERS_NEUTRALIZES_FOES_REDUCES_DAMAGE_BY_PERCENTAGE_EFFECTS_FROM_FOES_NON_SPECIAL_EXCLUDING_AOE_SPECIALS_NODE,
        ),
    ));
    BEFORE_AOE_SPECIAL_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // If unit is within 3 spaces of an ally:
        IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_TARGETS_ALLY_NODE,
            // 	•	Reduces damage from area-of-effect Specials by number of allies within 3 spaces × 40% (max 80%; excluding Røkkr area-of-effect Specials)
            REDUCES_DAMAGE_FROM_AOE_SPECIALS_BY_X_PERCENT_NODE(
                MULT_MAX_NODE(NUM_OF_TARGETS_ALLIES_WITHIN_3_SPACES_NODE, 40, 80),
            )
        ),
    ));
}

// Res Scowl Echo (Unknown slot, likely A or X-type)
{
    let skillId = PassiveX.ResScowlEcho;
    setAtStartOfCombatAndAfterStatsDeterminedHooks(skillId,
        // If foe initiates combat or foe’s HP ≥ 75% at start of combat:
        DOES_FOE_INITIATE_COMBAT_NODE_OR_IS_FOES_HP_GTE_75_PERCENT_AT_START_OF_COMBAT_NODE,
        SKILL_EFFECT_NODE(
            // 	•	Grants Res+4 to unit during combat
            GRANTS_RES_TO_TARGET_DURING_COMBAT_NODE(4),
        ),
        SKILL_EFFECT_NODE(
            // 	•	If foe’s attack can trigger foe’s Special and unit’s Res ≥ foe’s Res + 5,
            IF_NODE(
                AND_NODE(
                    CAN_FOES_ATTACK_TRIGGER_FOES_SPECIAL_NODE,
                    GTE_NODE(UNITS_EVAL_RES_NODE, ADD_NODE(FOES_EVAL_RES_NODE, 5))
                ),
                // inflicts Special cooldown count +1 on foe before foe’s first attack during combat
                // (Cannot exceed foe’s maximum Special cooldown)
                INFLICTS_SPECIAL_COOLDOWN_COUNT_PLUS_N_ON_TARGETS_FOE_BEFORE_TARGETS_FOES_FIRST_ATTACK_NODE(1),
            ),
        ),
    );
}

// Proud Spear
{
    let skillId = getNormalSkillId(Weapon.ProudSpear);
    // Mt 16 Rng 1 HP+3
    // Enables [Canto (2)] •
    enablesCantoN(skillId, 2);
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // If unit initiates combat or if foe's HP ≥ 75% at start of combat,
        IF_NODE(OR_NODE(
                DOES_UNIT_INITIATE_COMBAT_NODE,
                IS_FOES_HP_GTE_75_PERCENT_AT_START_OF_COMBAT_NODE),
            // grants Atk/Spd/Def/Res+5
            GRANTS_ALL_STATS_PLUS_5_TO_TARGET_DURING_COMBAT_NODE,
            // to unit,
            // deals damage = 20% of unit's Def
            // (excluding area-of-effect Specials),
            DEALS_DAMAGE_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS(20, UNITS_DEF_DURING_COMBAT_NODE),
            // and unit makes a guaranteed follow-up attack during combat.
            UNIT_MAKES_GUARANTEED_FOLLOW_UP_ATTACK_NODE,
        ),
    ));
}
{
    let skillId = getSpecialRefinementSkillId(Weapon.ProudSpear);
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // At start of turn,
        // if unit's HP ≥ 25%,
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_TURN_NODE(
            // on closest foes and any foe within 2 spaces of those foes through their next actions.
            FOR_EACH_TARGETS_CLOSEST_FOE_AND_ANY_FOE_WITHIN_2_SPACES_OF_THOSE_FOES_NODE(
                // inflicts Atk/Def-7,
                INFLICTS_ATK_DEF_ON_TARGET_ON_MAP_NODE(7),
                // (Discord],
                // and [Stall]
                INFLICTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.Discord, StatusEffectType.Stall),
            ),
        ),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // At start of combat,
        // if unit's HP ≥ 25%,
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE(
            // grants Atk/Spd/Def/Res+5 to unit and
            GRANTS_ALL_STATS_PLUS_5_TO_TARGET_DURING_COMBAT_NODE,
            // inflicts Special cooldown charge -1 on foe per attack during combat (only highest value applied; does not stack),
            INFLICTS_SPECIAL_COOLDOWN_CHARGE_MINUS_1_ON_FOE_NODE,
            // and restores 7 HP to unit after combat.
            RESTORES_7_HP_TO_UNIT_AFTER_COMBAT_NODE,
        ),
    ));
}

// Tome of Fury
{
    let skillId = getNormalSkillId(Weapon.TomeOfFury);
    // Mt 14 Rng 2
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // Grants weapon-triangle advantage against colorless foes,
        // and inflicts weapon-triangle disadvantage on colorless foes during combat.
        GRANTS_TRIANGLE_ADVANTAGE_AGAINST_COLORLESS_TARGETS_FOES_AND_INFLICTS_TRIANGLE_DISADVANTAGE_ON_COLORLESS_TARGETS_FOES_DURING_COMBAT_NODE,
        // At start of combat,
        // if unit's HP ≥ 25%,
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE(
            // grants Atk/Spd/Def/Res+5 to unit,
            GRANTS_ALL_STATS_PLUS_5_TO_TARGET_DURING_COMBAT_NODE,
            // deals damage = 20% of unit's Res (excluding area-of-effect Specials),
            DEALS_DAMAGE_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS(20, UNITS_RES_DURING_COMBAT_NODE),
            // and reduces damage from foe's attacks by 7 during combat (excluding area-of-effect Specials).
            REDUCES_DAMAGE_FROM_TARGETS_FOES_ATTACKS_BY_X_DURING_COMBAT_NODE(7),
        ),
    ));
}
{
    let skillId = getSpecialRefinementSkillId(Weapon.TomeOfFury);
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // At start of turn,
        // if unit is within 2 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_2_SPACES_OF_TARGETS_ALLY_NODE,
            // to unit and allies within 2 spaces of unit for 1 turn.
            FOR_EACH_TARGET_AND_TARGETS_ALLY_WITHIN_2_SPACES_OF_TARGET_NODE(
                // grants Atk/Res+6,
                GRANTS_ATK_RES_TO_TARGET_ON_MAP_NODE(6),
                // "neutralizes foe's bonuses during combat," and
                // [Hexblade]
                GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(
                    StatusEffectType.NeutralizesFoesBonusesDuringCombat, StatusEffectType.Hexblade),
            ),
        ),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // If unit initiates combat or is within 2 spaces of an ally,
        IF_UNIT_INITIATES_COMBAT_OR_IS_WITHIN_2_SPACES_OF_AN_ALLY(
            // grants Atk/Spd/Def/Rest5 to unit and
            GRANTS_ALL_STATS_PLUS_5_TO_TARGET_DURING_COMBAT_NODE,
            // unit makes a guaranteed follow-up attack during combat,
            UNIT_MAKES_GUARANTEED_FOLLOW_UP_ATTACK_NODE,
            // and restores 7 HP to unit after combat.
            RESTORES_7_HP_TO_UNIT_AFTER_COMBAT_NODE,
        ),
    ));
}

// Taciturn Axe
{
    let skillId = getNormalSkillId(Weapon.TaciturnAxe);
    // Mt 16 Rng 1 HP+3
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // If unit is within 3 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_TARGETS_ALLY_NODE,
            // inflicts Atk/Def-6 on foe,
            INFLICTS_ATK_DEF_ON_FOE_DURING_COMBAT_NODE(6),
            // deals damage = X% of
            // unit's Def (excluding area-of-effect Specials),
            // and reduces damage from foe's attacks by X% of unit's Def during combat
            // (excluding area-of-effect Specials;
            // if unit is within 3 spaces a certain target ally,
            // X = 30; otherwise,
            // X = 20;
            // if support partner is on player team,
            // targets support partner; if support partner is not on player team,
            // targets ally with the highest Atk on player team, excluding unit).

            // If unit is within 3 spaces of an ally,
            // restores 7 HP to unit after combat.
            RESTORES_7_HP_TO_UNIT_AFTER_COMBAT_NODE,
        ),
    ));
    WHEN_APPLIES_EFFECTS_AFTER_COMBAT_STATS_DETERMINED_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_TARGETS_ALLY_NODE,
            X_NUM_NODE(
                // deals damage = X% of
                // unit's Def (excluding area-of-effect Specials),
                UNIT_DEALS_DAMAGE_EXCLUDING_AOE_SPECIALS_NODE(
                    PERCENTAGE_NODE(READ_NUM_NODE, UNITS_DEF_DURING_COMBAT_NODE)),
                // and reduces damage from foe's attacks by X% of unit's Def during combat
                // (excluding area-of-effect Specials;
                REDUCES_DAMAGE_FROM_TARGETS_FOES_ATTACKS_BY_X_DURING_COMBAT_NODE(
                    PERCENTAGE_NODE(READ_NUM_NODE, UNITS_DEF_DURING_COMBAT_NODE)
                ),
                // if unit is within 3 spaces a certain target ally,
                COND_OP(IS_TARGET_WITHIN_N_SPACES_OF_TARGETS_ALLY_NODE(3,
                        // X = 30; otherwise,
                        // X = 20;
                        // if support partner is on player team,
                        // targets support partner; if support partner is not on player team,
                        // targets ally with the highest Atk on player team, excluding unit).
                        OR_NODE(
                            AND_NODE(
                                IS_THERE_SKILL_OWNERS_PARTNER_ON_MAP_NODE,
                                ARE_TARGET_AND_SKILL_OWNER_PARTNERS_NODE
                            ),
                            AND_NODE(
                                NOT_NODE(IS_THERE_SKILL_OWNERS_PARTNER_ON_MAP_NODE),
                                HIGHEST_ATK_ALLIES_ON_MAP_NODE,
                            ),
                        )),
                    30,
                    20,
                ),
            ),
        ),
    ));
}
{
    let skillId = getSpecialRefinementSkillId(Weapon.TaciturnAxe);
    let nodeFunc = () => SKILL_EFFECT_NODE(
        FOR_EACH_SPACES_NODE(SPACES_WITHIN_N_SPACES_OF_SKILL_OWNER_NODE(2),
            // applies (Divine Vein (Stone)) to unit's space and spaces within 2 spaces of unit for 1 turn.
            APPLY_DIVINE_VEIN_NODE(DivineVeinType.Stone, TARGET_GROUP_NODE, 1),
        ),
    );
    // After unit acts (if Canto triggers, after Canto) or,
    AFTER_UNIT_ACTS_IF_CANTO_TRIGGERS_AFTER_CANTO_HOOKS.addSkill(skillId, nodeFunc);
    // if defending in Aether Raids, at the start of enemy phase,
    AT_START_OF_ENEMY_PHASE_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        IF_NODE(WHEN_DEFENDING_IN_AETHER_RAIDS_NODE,
            nodeFunc(),
        ),
    ));

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // If foe initiates combat or foe's HP ≥ 75% at start of combat,
        IF_FOE_INITIATES_COMBAT_OR_IF_FOES_HP_GTE_75_PERCENT_AT_START_OF_COMBAT(
            // inflicts penalty on foe's Atk/Def =
            INFLICTS_ATK_DEF_ON_FOE_DURING_COMBAT_NODE(
                // 10% of unit's Def at start of combat + 6 and
                ADD_NODE(PERCENTAGE_NODE(10, UNITS_DEF_AT_START_OF_COMBAT_NODE), 6),
            ),
            // neutralizes unit's penalties during combat.
            NEUTRALIZES_PENALTIES_ON_UNIT_NODE,
        ),
    ));
}

// Tome of Dusk
{
    let skillId = Weapon.TomeOfDusk;
    // Mt: 14
    // Rng: 2
    // Enables [Canto (Rem.; Min 1)) .
    enablesCantoRemPlusMin(skillId, 0, 1);
    // Accelerates Special trigger (cooldown count-1).
    // If a Rally or movement Assist skill is used by unit,
    // grants another action to unit (once per turn).
    AFTER_RALLY_ENDED_BY_UNIT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        GRANTS_ANOTHER_ACTION_ON_ASSIST_NODE,
    ));
    AFTER_MOVEMENT_ASSIST_ENDED_BY_UNIT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        GRANTS_ANOTHER_ACTION_ON_ASSIST_NODE,
    ));
    // After unit acts (if Canto triggers, after Canto),
    AFTER_UNIT_ACTS_IF_CANTO_TRIGGERS_AFTER_CANTO_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // grants Special cooldown count-1 to unit, and also,
        GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_ON_TARGET_ON_MAP_NODE(1),
        // if the number of times unit has acted on the current turn (not counting Canto) ≤ 2,
        IF_NODE(LTE_NODE(NUMBER_OF_TIMES_TARGET_HAS_ACTED_ON_THE_CURRENT_TURN_NOT_COUNTING_CANTO_NODE, 2),
            // for foes with Res ‹ unit's Res+5,
            // triggers the following effects based on the foe's position: if foe is within 3 rows or 3 columns centered on unit,
            FOR_EACH_UNIT_NODE(
                FILTER_UNITS_NODE(
                    TARGETS_FOES_ON_MAP_NODE,
                    IS_TARGET_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_SKILL_OWNER_NODE),
                IF_NODE(LT_NODE(TARGETS_EVAL_RES_ON_MAP, ADD_NODE(SKILL_OWNERS_EVAL_RES_ON_MAP, 5)),
                    // inflicts Atk/Res-7 and [Sabotage) on foe;
                    INFLICTS_STATS_MINUS_ON_TARGET_ON_MAP_NODE(7, 0, 0, 7),
                ),
            ),
            FOR_EACH_UNIT_NODE(
                // if foe is in cardinal directions of unit,
                FILTER_UNITS_NODE(
                    TARGETS_FOES_ON_MAP_NODE,
                    IS_TARGET_IN_CARDINAL_DIRECTIONS_OF_SKILL_OWNER_NODE),
                // also inflicts (Gravity) on foe (all effects are inflicted through foes' next actions).
                INFLICTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.Gravity),
            ),
        ),
    ));
    let [dealsDamageBeforeCombat, dealsDamageDuringCombat] =
        DEALS_DAMAGE_PERCENTAGE_OF_TARGETS_STAT_NODES(STATUS_INDEX.Res, 20);
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // At start of combat,
        // if unit's HP ≥ 25%,
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE(
            // grants bonus to
            // unit's Atk/Spd/Def/Res =
            GRANTS_ALL_STATS_PLUS_N_TO_TARGET_DURING_COMBAT_NODE(
                // number of foes within 3 rows or 3 columns centered on unit x 3, + 5 (max 14),
                ENSURE_MAX_NODE(
                    ADD_NODE(MULT_NODE(NUM_OF_FOES_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_UNIT_NODE, 3), 5),
                    14
                ),
            ),
            // deals damage = 20% of unit's Res (including area-of-effect Specials),
            dealsDamageDuringCombat,
            // and reduces the percentage of foe's non-Special "reduce damage by X%" skills by 50% during combat (excluding area-of-effect Specials).
            REDUCES_PERCENTAGE_OF_TARGETS_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE,
        ),
    ));
    BEFORE_AOE_SPECIAL_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE(
            dealsDamageBeforeCombat,
        ),
    ));
}

// Axe of Dusk
{
    let skillId = Weapon.AxeOfDusk;
    // Mt: 16 Rng: 1
    // Enables [Canto (Dist. +1; Max 4)] .
    enablesCantoDist(skillId, 1, 4);
    // Accelerates Special trigger (cooldown count-1).

    // At start of player phase or enemy phase,
    let nodeFunc = () => SKILL_EFFECT_NODE(
        // on foes that are within 2 spaces of another foe through their next actions.
        FOR_EACH_UNIT_NODE(
            TARGETS_FOES_THAT_ARE_WITHIN_N_SPACES_OF_ANOTHER_TARGETS_FOE_NODE(2),
            // inflicts Spd/Def-7,
            INFLICTS_STATS_MINUS_ON_TARGET_ON_MAP_NODE(0, 7, 7, 0),
            // (Discord), and Deep Wounds
            INFLICTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.Discord, StatusEffectType.DeepWounds),
        ),
    );
    AT_START_OF_TURN_HOOKS.addSkill(skillId, nodeFunc);
    AT_START_OF_ENEMY_PHASE_HOOKS.addSkill(skillId, nodeFunc);

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // If unit initiates combat or if foe's HP ≥ 75% at start of combat,
        IF_FOE_INITIATES_COMBAT_OR_IF_FOES_HP_GTE_75_PERCENT_AT_START_OF_COMBAT(

        ),
        // grants bonus to unit's Atk/Spd/Def/Res =
        GRANTS_ALL_STATS_PLUS_N_TO_TARGET_DURING_COMBAT_NODE(
            // number of foes within 3 rows or 3 columns centered on unit x 3, + 5 (max 14),
            ENSURE_MAX_NODE(
                ADD_NODE(MULT_NODE(NUM_OF_FOES_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_UNIT_NODE, 3), 5),
                14
            ),
        ),
        X_NUM_NODE(
            // unit deals + Y damage
            UNIT_DEALS_DAMAGE_EXCLUDING_AOE_SPECIALS_NODE(READ_NUM_NODE),
            // (Y = total number of Bonuses and Penalties active on foe and any foe within 2 spaces of foe,
            // excluding stat bonuses and stat penalties,
            // x 3; excluding area-of-effect Specials),
            MULT_NODE(totalNumberOfBonusesAndPenaltiesActiveOnFoeAndAnyFoeWithinNSpacesOfFoe(2), 3),
        ),
        // and grants Special cooldown charge + 1 to unit per attack during combat (only highest value applied; does not stack),
        GRANTS_SPECIAL_COOLDOWN_CHARGE_PLUS_1_TO_UNIT_PER_ATTACK_DURING_COMBAT_NODE,
        // and also,
        // if decreasing the Spd difference necessary to make a follow-up attack by 25 would allow unit to trigger a follow-up attack (excluding guaranteed or prevented follow-ups),
        // triggers (Potent Follow X%) during combat
        // (if unit cannot perform follow-up and attack twice, X = 80; otherwise, X = 40).
        APPLY_POTENT_EFFECT_NODE,
    ));
}

// Trample
{
    let skillId = PassiveA.Trample;
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // If unit initiates combat or if foe's HP ≥ 75% at start of combat,
        IF_NODE(OR_NODE(DOES_UNIT_INITIATE_COMBAT_NODE, IS_FOES_HP_GTE_75_PERCENT_AT_START_OF_COMBAT_NODE),
            // grants Atk/Spd+7 to unit during combat,
            GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE(7, 7, 0, 0),
            // and also,
            IF_NODE(
                OR_NODE(
                    // if foe is infantry or armored,
                    OR_NODE(IS_FOE_INFANTRY_NODE, IS_FOE_ARMOR_NODE),
                    // or if any space within 2 spaces of unit has a Divine Vein effect applied or counts as difficult terrain,
                    // excluding impassable terrain,
                    IS_THERE_SPACE_WITHIN_2_SPACES_THAT_HAS_DIVINE_VEIN_OR_COUNTS_AS_DIFFICULT_TERRAIN_EXCLUDING_IMPASSABLE_TERRAIN_NODE,
                ),
                // grants an additional Atk/Spd+3 to unit and
                GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE(3, 3, 0, 0),
                // unit deals +5 damage during combat (excluding area-of-effect Specials).
                UNIT_DEALS_DAMAGE_EXCLUDING_AOE_SPECIALS_NODE(5),
            ),
        ),
        // If unit initiates combat,
        IF_NODE(DOES_UNIT_INITIATE_COMBAT_NODE,
            // unit can make a follow-up attack before foe's next attack.
            UNIT_CAN_MAKE_FOLLOW_UP_ATTACK_BEFORE_FOES_NEXT_ATTACK_NODE,
        ),
    ));
}

// Tut-Tut!
{
    let skillId = PassiveB.TutTut;
    // Unit can move through foes' spaces.
    UNIT_CAN_MOVE_THROUGH_FOES_SPACES_HOOKS.addSkill(skillId, () => TRUE_NODE);
    // Unit can move to a space within 2 spaces of any ally within 2 spaces of unit.
    setSkillThatUnitCanMoveToAnySpaceWithinNSpacesOfAnAllyWithinMSpacesOfUnit(skillId, 2, 2);
    // Unit can move to a space within 5 spaces where a Divine Vein effect is applied.
    UNIT_CAN_MOVE_TO_A_SPACE_HOOKS.addSkill(skillId, () => new UniteSpacesNode(
        SPACES_ON_MAP_NODE(
            AND_NODE(
                IS_SPACE_WITHIN_N_SPACES_OF_TARGET_NODE(5),
                IS_THERE_DIVINE_VEIN_EFFECT_APPLIED_ON_TARGET_SPACES_NODE
            ),
        ),
    ));
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // At start of turn,
        // if unit's HP ≥ 25%,
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_TURN_NODE(
            // grants Atk/Spd+6 and
            GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE(6, 6, 0, 0),
            // "reduces the percentage of foe's non-Special 'reduce damage by X%' skills by 50% during combat (excluding area-of-effect Specials)" to unit and allies within 2 spaces of unit for 1 turn.
            REDUCES_PERCENTAGE_OF_TARGETS_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE,
        ),
    ));
    AT_START_OF_TURN_AFTER_HEALING_AND_DAMAGE_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // At start of turn,
        // if unit's HP ≥ 25% after start-of-turn healing and damage effects are applied,
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_TURN_NODE(
            // applies (Divine Vein (Haze)] on closest foes' spaces and on each space within 2 spaces of those spaces for 1 turn.
            FOR_EACH_SPACES_NODE(
                SPACES_WITHIN_N_SPACES_OF_SPACES_NODE(2, PLACED_SPACES_NODE(TARGETS_CLOSEST_FOES_NODE)),
                APPLY_DIVINE_VEIN_NODE(DivineVeinType.Haze, TARGET_GROUP_NODE, 1),
            ),
        ),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // At start of combat,
        // if unit's HP ≥ 25%,
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE(
            // inflicts Spd/Def-5 on foe,
            INFLICTS_STATS_MINUS_ON_FOE_DURING_COMBAT_NODE(0, 5, 5, 0),
            // deals damage = 20% of unit's Spd (excluding area-of-effect Specials),
            DEALS_DAMAGE_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS(20, UNITS_SPD_DURING_COMBAT_NODE),
            // and neutralizes effects that guarantee foe's follow-up attacks and effects that prevent unit's follow-up attacks during combat.
            NULL_UNIT_FOLLOW_UP_NODE,
        ),
    ));
}

// Baton of Dusk
{
    let skillId = Weapon.BatonOfDusk;
    // Mt: 14
    // Rng:2
    // Grants Spd+3.
    // Enables /Canto (Rem.; Min 1)) .
    enablesCantoRemPlusMin(skillId, 0, 1);
    // Calculates damage from staff like other weapons.
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // At start of turn,
        // if unit's HP ≥ 25%,
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_TURN_NODE(
            // to unit and allies within 2 spaces of unit for 1 turn.
            FOR_EACH_TARGET_AND_TARGETS_ALLY_WITHIN_2_SPACES_OF_TARGET_NODE(
                // grants Atk/Spd+6,
                GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE(6, 6, 0, 0),
                // (Treachery),
                // and "grants Special cooldown charge + 1 per attack during combat (only highest value applied; does not stack)"
                GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(
                    StatusEffectType.Treachery, StatusEffectType.SpecialCooldownChargePlusOnePerAttack),
            ),
        ),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // At start of combat,
        // if unit's HP ≥ 25%,
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE(
            // grants bonus to unit's Atk/Spd/Def/Res =
            GRANTS_ALL_STATS_PLUS_N_TO_TARGET_DURING_COMBAT_NODE(
                // number of foes within 3 rows or 3 columns centered on unit x 3, + 5 (max 14),
                ENSURE_MAX_NODE(
                    ADD_NODE(MULT_NODE(NUM_OF_FOES_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_UNIT_NODE, 3), 5),
                    14
                ),
            ),
            // deals damage = 20% of unit's Spd
            // (excluding area-of-effect Specials;
            // if the "calculates damage from staff like other weapons" effect is neutralized,
            // damage from staff is calculated after combat damage is added),
            DEALS_DAMAGE_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS(20, UNITS_SPD_DURING_COMBAT_NODE),
            // and neutralizes effects that guarantee foe's follow-up attacks and effects that prevent unit's follow-up attacks during combat.
            NULL_UNIT_FOLLOW_UP_NODE,
        ),
    ));
}

// Tidings
{
    let setSkill = (skillId, grantsNode) => {
        AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
            // If unit initiates combat or is within 3 spaces of an ally,
            IF_UNIT_INITIATES_COMBAT_OR_IS_WITHIN_3_SPACES_OF_AN_ALLY(
                X_NUM_NODE(
                    // grants bonus to unit's Atk/Spd =
                    grantsNode,
                    // number of allies within 3 spaces of unit x 2, + 8 (max 12),
                    ENSURE_MAX_NODE(ADD_NODE(MULT_NODE(NUM_OF_TARGETS_ALLIES_WITHIN_3_SPACES_NODE, 2), 8), 12),
                ),
                // and foe cannot counterattack during combat.
                FOE_CANNOT_COUNTERATTACK_NODE,
            ),
        ));
    };
    setSkill(PassiveA.AtkSpdTidings, GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE(READ_NUM_NODE, READ_NUM_NODE, 0, 0));
    setSkill(PassiveA.AtkResTidings, GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE(READ_NUM_NODE, 0, 0, READ_NUM_NODE));
}

// Duskstone
{
    let skillId = Weapon.Duskstone;
    // Mt: 16
    // Rng: 1
    // Accelerates Special trigger (cooldown count-1).
    // If foe's Range = 2, calculates damage using the lower of foe's Def or Res.
    // At start of turn,
    // and at start of enemy phase (except for in Summoner Duels),
    let nodeFunc = () => SKILL_EFFECT_NODE(
        // if unit's HP ≥ 25%,
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_TURN_NODE(
            // to unit and allies within 2 spaces of unit,
            FOR_EACH_TARGET_AND_TARGETS_ALLY_WITHIN_2_SPACES_OF_TARGET_NODE(
                // grants [Draconic Hex]
                GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.DraconicHex),
                // and if unit's Special cooldown count is at its maximum value, grants Special cooldown count-1 to unit.
                AT_START_OF_TURN_IF_TARGETS_SPECIAL_COOLDOWN_COUNT_IS_AT_ITS_MAXIMUM_VALUE_GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_X_NODE(1),
            ),
        ),
    );
    AT_START_OF_TURN_HOOKS.addSkill(skillId, nodeFunc);
    AT_START_OF_ENEMY_PHASE_HOOKS.addSkill(skillId, nodeFunc);
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // At start of combat,
        // if unit's HP ≥ 25%,
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE(
            // inflicts penalty on foe's Atk/Spd/Def/Res =
            INFLICTS_ALL_STATS_MINUS_N_ON_FOE_DURING_COMBAT_NODE(
                // number of foes within 3 rows or 3 columns centered on unit x 3, + 5
                // (max 14; if unit triggers Savior, value is treated as 14),
                COND_OP(IS_TARGETS_SAVIOR_TRIGGERED_NODE,
                    14,
                    ENSURE_MAX_NODE(
                        ADD_NODE(MULT_NODE(NUM_OF_FOES_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_UNIT_NODE, 3), 5),
                        14
                    ),
                ),
            ),
            X_NUM_NODE(
                // unit deals +X damage (excluding area-of-effect Specials),
                UNIT_DEALS_DAMAGE_EXCLUDING_AOE_SPECIALS_NODE(READ_NUM_NODE),
                // and reduces damage from foe's attacks by X during combat (excluding area-of-effect Specials;
                REDUCES_DAMAGE_FROM_TARGETS_FOES_ATTACKS_BY_X_DURING_COMBAT_NODE(READ_NUM_NODE),
                // X = number of allies within 3 spaces of unit x 5; max 15; if unit triggers Savior, value is treated as 15),
                COND_OP(IS_TARGETS_SAVIOR_TRIGGERED_NODE,
                    15,
                    ENSURE_MAX_NODE(MULT_NODE(NUM_OF_TARGETS_ALLIES_WITHIN_3_SPACES_NODE, 5), 15),
                ),
            ),
            // and also,
            // if foe's attack can trigger foe's Special and unit's Res ≥ foe's Res+5,
            IF_NODE(
                AND_NODE(
                    CAN_FOES_ATTACK_TRIGGER_FOES_SPECIAL_NODE,
                    GTE_NODE(UNITS_EVAL_RES_DURING_COMBAT_NODE, ADD_NODE(FOES_EVAL_RES_DURING_COMBAT_NODE, 5))),
                // triggers the following effects during combat:
                // inflicts Special cooldown count+1 on foe before foe's first attack and
                INFLICTS_SPECIAL_COOLDOWN_COUNT_PLUS_N_ON_TARGETS_FOE_BEFORE_TARGETS_FOES_FIRST_ATTACK_NODE(1),
                // if foe's first attack triggers the "attacks twice" effect,
                IF_NODE(IF_TARGET_TRIGGERS_ATTACKS_TWICE_NODE,
                    // inflicts Special cooldown count+1 on foe before foe's second strike as well
                    INFLICTS_SPECIAL_COOLDOWN_COUNT_PLUS_N_ON_TARGETS_FOE_BEFORE_TARGETS_FOES_SECOND_STRIKE_NODE(1),
                    // (in either case, cannot exceed the foe's maximum Special cooldown).
                ),
            ),
            // If unit's HP ≥ 25% at start of combat and
            IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE(
                // unit's Special cooldown count is at its maximum value after combat,
                // grants Special cooldown count-l to unit after combat.
                GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_1_IF_COUNT_IS_MAX_AFTER_COMBAT_NODE,
            ),
        ),
    ));
}

// [Draconic Hex]
{
    let skillId = getStatusEffectSkillId(StatusEffectType.DraconicHex);
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // Inflicts Atk/Spd/Def/Res-5 on foe during combat and inflicts
        INFLICTS_ALL_STATS_MINUS_5_ON_FOE_DURING_COMBAT_NODE,
        FOR_EACH_STAT_INDEX_NODE(
            INFLICTS_STAT_MINUS_AT_ON_FOE_DURING_COMBAT_NODE(READ_NUM_NODE,
                // penalty on each of those stats = 5 - current penalty on each of
                // those stats for 1 turn (min 0; calculates each stat penalty independently).
                ENSURE_MIN_NODE(SUB_NODE(5, TARGETS_PENALTY_NODE(READ_NUM_NODE)), 0),
            ),
        ),
    ));
}

// Dragon Fang Fire
{
    let skillId = Special.DragonFangFire;
    WHEN_APPLIES_SPECIAL_EFFECTS_AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // Boosts damage by 40% of unit's Res when Special triggers.
        BOOSTS_DAMAGE_WHEN_SPECIAL_TRIGGERS_NODE(PERCENTAGE_NODE(40, UNITS_RES_DURING_COMBAT_NODE)),
    ));
    // If a skill compares unit's Res to a foe's or ally's Res,
    // treats unit's Res as if granted +5.
    AT_COMPARING_STATS_HOOKS.addSkill(skillId, () => STATS_NODE(0, 0, 0, 5));

    let reduceNode = SKILL_EFFECT_NODE(
        // If unit's Res > foe's Res,
        IF_NODE(GT_NODE(UNITS_EVAL_RES_NODE, FOES_EVAL_RES_NODE),
            // reduces damage from attacks during combat and from area-of-effect Specials
            // (excluding Rokkr area-of-effect Specials) by percentage = difference between
            // stats × X
            // (max X x 10%; if from area-of-effect Special, X = 8 - current Special cooldown count value; otherwise,
            // X = 4 - current, Special cooldown count value).
            X_NUM_NODE(
                REDUCES_DAMAGE_FROM_TARGETS_FOES_ATTACKS_BY_X_PERCENT_BY_SPECIAL_DURING_COMBAT_OR_FROM_AOE_SPECIALS_NODE(
                    ENSURE_MAX_NODE(
                        MULT_NODE(RES_DIFF_NODE, READ_NUM_NODE),
                        MULT_NODE(SUB_NODE(READ_NUM_NODE, TARGETS_SPECIAL_COOLDOWN_COUNT_NODE), 10)
                    ),
                ),
                COND_OP(IS_IN_COMBAT_PHASE_NODE, 4, 8),
            ),
        ),
    );
    BEFORE_AOE_SPECIAL_HOOKS.addSkill(skillId, () => reduceNode);
    WHEN_APPLIES_EFFECTS_AFTER_COMBAT_STATS_DETERMINED_HOOKS.addSkill(skillId, () => reduceNode);

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // If unit's Special is ready or unit's Special triggered during combat,
        IF_NODE(IF_TARGETS_SPECIAL_IS_READY_OR_HAS_TRIGGERED_DURING_COMBAT_NODE,
            // reduces the percentage of foe's non-Special "reduce damage by X%" skills by 50%.
            REDUCES_PERCENTAGE_OF_TARGETS_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE,
        ),
    ));
    // After combat,
    AFTER_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // if unit's Special triggered,
        IF_NODE(IS_UNITS_SPECIAL_TRIGGERED,
            // applies (Divine Vein (Water)] on target's space and on each space within 2 spaces of target's space for 1 turn.
            FOR_EACH_SPACES_NODE(SPACES_WITHIN_N_SPACES_OF_SPACES_NODE(2, TARGETS_PLACED_SPACE_NODE),
                APPLY_DIVINE_VEIN_NODE(DivineVeinType.Water, TARGET_GROUP_NODE, 1),
            ),
        ),
    ));
}

// 命脈
{
    let setSkill = (skillId, grantsNode) => {
        // Grants HP+5.
        AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
            // If foe initiates combat or if unit's HP ≥ 50% at start of combat,
            IF_NODE(OR_NODE(DOES_FOE_INITIATE_COMBAT_NODE, IS_UNITS_HP_GTE_50_PERCENT_AT_START_OF_COMBAT_NODE),
                // grants Spd/Def/Res+9 to unit during combat and
                grantsNode,
                // restores 7 HP to unit after combat.
                RESTORES_7_HP_TO_UNIT_AFTER_COMBAT_NODE,
            ),
        ));
    };
    setSkill(PassiveA.PrimordialBoost, GRANTS_SPD_DEF_RES_TO_TARGET_DURING_COMBAT_NODE(9));
    setSkill(PassiveA.DiluvialBoost, GRANTS_ATK_DEF_RES_TO_TARGET_DURING_COMBAT_NODE(9));
}

// Duo Skill
{
    let skillId = getDuoOrHarmonizedSkillId(Hero.DuoCorrinM);
    WHEN_TRIGGERS_DUO_OR_HARMONIZED_EFFECT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // Grants the following status to unit and allies within 3 spaces of unit for 1 turn:
        FOR_EACH_UNIT_NODE(TARGETS_AND_THOSE_ALLIES_WITHIN_N_SPACES_NODE(3, TARGET_NODE),
            // increases Spd difference necessary for foe to make a follow-up attack by 10 during combat.
            GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(
                StatusEffectType.IncreasesSpdDifferenceNecessaryForFoeToMakeAFollowUpAttackBy10DuringCombat),
        ),
        // Applies [Divine Vein (Water)] to unit's space and spaces within 3 spaces of unit for 2 turns.
        FOR_EACH_SPACES_NODE(SPACES_WITHIN_N_SPACES_OF_SPACES_NODE(3, TARGETS_PLACED_SPACE_NODE),
            APPLY_DIVINE_VEIN_NODE(DivineVeinType.Water, TARGET_GROUP_NODE, 2),
        ),
    ));
}

{
    let skillId = Weapon.SwordOfDusk;
    // Grants Atk+3.
    // Enables【Canto (Rem. +1; Min ２)】.
    enablesCantoRemPlusMin(skillId, 1, 2);
    // For foes within 3 rows or 3 columns centered on unit,
    WHEN_INFLICTS_STATS_MINUS_TO_FOES_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        IF_NODE(IS_TARGET_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_SKILL_OWNER_NODE,
            // inflicts Atk/Spd/Def-5,
            INFLICTS_ATK_SPD_DEF_ON_FOE_DURING_COMBAT_NODE(5),
        ),
    ));
    WHEN_INFLICTS_EFFECTS_TO_FOES_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        IF_NODE(IS_TARGET_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_SKILL_OWNER_NODE,
            // neutralizes effects that grant "Special cooldown charge +X" to foe,
            NEUTRALIZES_EFFECTS_THAT_GRANT_SPECIAL_COOLDOWN_CHARGE_PLUS_X_TO_FOE,
            // and those foes suffer guaranteed follow-up attacks during combat.
            UNIT_MAKES_GUARANTEED_FOLLOW_UP_ATTACK_NODE,
        ),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // At start of combat,
        // if unit's HP ≥ 25%,
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE(
            // grants bonus to unit's Atk/Spd/Def/Res =
            GRANTS_BONUS_TO_TARGETS_ATK_SPD_DEF_RES_NODE(
                // number of foes within 3 rows or 3 columns centered on unit × 3 (max 9),
                ENSURE_MAX_NODE(MULT_NODE(NUM_OF_FOES_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_UNIT_NODE, 3), 9)
            ),
        ),
    ));
    WHEN_APPLIES_EFFECTS_AFTER_COMBAT_STATS_DETERMINED_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE(
            X_NUM_NODE(
                // deals damage = X% of unit's Def (excluding area-of-effect Specials),
                UNIT_DEALS_DAMAGE_EXCLUDING_AOE_SPECIALS_NODE(
                    PERCENTAGE_NODE(READ_NUM_NODE, UNITS_DEF_DURING_COMBAT_NODE)),
                // and reduces damage from foe's attacks by X% of unit's Def during combat
                REDUCES_DAMAGE_FROM_TARGETS_FOES_ATTACKS_BY_X_DURING_COMBAT_NODE(
                    PERCENTAGE_NODE(READ_NUM_NODE, UNITS_DEF_DURING_COMBAT_NODE)),
                // (excluding area-of-effect Specials; if foe's HP ≥ 50% at start of combat, X = 25; otherwise, X = 15).
                COND_OP(GTE_NODE(FOES_HP_PERCENTAGE_AT_START_OF_COMBAT_NODE, 50), 25, 15),
            ),
        ),
    ));
}

{
    let skillId = getNormalSkillId(Weapon.TailwindShuriken);
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
    ));
}
{
    let skillId = getRefinementSkillId(Weapon.TailwindShuriken);
    // Accelerates Special trigger (cooldown count-1).
    // Grants Atk/Spd+6. Inflicts Def/Res-4.
    ATK_WITH_SKILLS_MAP.set(skillId, 6);
    SPD_WITH_SKILLS_MAP.set(skillId, 2);
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // If unit initiates combat, unit attacks twice.
        TARGET_ATTACKS_TWICE_WHEN_TARGET_INITIATES_COMBAT_NODE,
        // At start of combat,
        // if unit's HP ≥ 25%,
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE(
            // grants bonus to unit's Atk/Spd =
            GRANTS_ATK_SPD_TO_TARGET_DURING_COMBAT_NODE(
                // number of allies within 3 rows or 3 columns centered on unit x 2 (max 6) and
                ENSURE_MAX_NODE(
                    MULT_NODE(NUM_OF_ALLIES_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_UNIT_NODE, 2), 6
                ),
            ),
            // disables skills of all foes excluding foe in combat during combat.
            UNIT_DISABLES_SKILLS_OF_ALL_OTHERS_IN_COMBAT_EXCLUDING_UNIT_AND_FOE_NODE,
        ),
    ));
}
{
    let skillId = getSpecialRefinementSkillId(Weapon.TailwindShuriken);
    WHEN_INFLICTS_EFFECTS_TO_FOES_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // For foes within 3 rows or 3 columns centered on unit,
        IF_NODE(IS_TARGET_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_SKILL_OWNER_NODE,
            // inflicts Spd/Def-5,
            INFLICTS_SPD_DEF_ON_FOE_DURING_COMBAT_NODE(5),
        ),
    ));
    WHEN_INFLICTS_EFFECTS_TO_FOES_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // For foes within 3 rows or 3 columns centered on unit, inflicts Spd/Def-5,
        IF_NODE(IS_TARGET_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_SKILL_OWNER_NODE,
            // reduces the percentage of foe's non-Special "reduce damage by X%" skills by 50% (excluding area-of-effect Specials),
            REDUCES_PERCENTAGE_OF_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE,
            // and those foes suffer guaranteed follow-up attacks during combat.
            UNIT_MAKES_GUARANTEED_FOLLOW_UP_ATTACK_NODE,
        ),
    ));
    WHEN_APPLIES_EFFECTS_AFTER_COMBAT_STATS_DETERMINED_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // At start of combat, if unit's HP ≥ 25%, deals
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE(
            // damage = 20% of unit's Spd during combat
            UNIT_DEALS_DAMAGE_EXCLUDING_AOE_SPECIALS_NODE(
                PERCENTAGE_NODE(20, UNITS_SPD_DURING_COMBAT_NODE)),
        ),
    ));
}

{
    let skillId = getNormalSkillId(Weapon.SilesseFrost);
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        IF_NODE(IS_FOES_HP_GTE_50_PERCENT_AT_START_OF_COMBAT_NODE,
            GRANTS_STATS_PLUS_TO_TARGET_ON_MAP_NODE(6, 6, 0, 0),
            IF_NODE(EXISTS_UNITS(TARGETS_ALLIES_WITHIN_2_SPACES_NODE(), ARE_TARGET_AND_SKILL_OWNER_PARTNERS_NODE),
                TARGET_ATTACKS_TWICE_WHEN_TARGET_INITIATES_COMBAT_NODE,
            ),
        ),
    ));
}
{
    let skillId = getRefinementSkillId(Weapon.SilesseFrost);
    // Grants Atk+3.
    // Enables [Canto (2)] •
    enablesCantoN(skillId, 2);
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // If unit initiates combat or foe's HP ≥ 50% at start of combat,
        IF_FOE_INITIATES_COMBAT_OR_IF_FOES_HP_GTE_50_PERCENT_AT_START_OF_COMBAT(
            // grants Atk/Spd+6 and Def/Res+5 to unit,
            GRANTS_ATK_SPD_TO_TARGET_DURING_COMBAT_NODE(6),
            GRANTS_DEF_RES_TO_TARGET_DURING_COMBAT_NODE(5),
            // reduces damage from foe's first attack by 7
            // ("first attack" normally means only the first strike; for effects that grant "unit attacks twice," it means the first and second strikes),
            REDUCES_DAMAGE_FROM_FOES_FIRST_ATTACK_BY_N_DURING_COMBAT_INCLUDING_TWICE_NODE(7),
            // and neutralizes effects that guarantee foe's follow-up attacks and effects that prevent unit's follow-up attacks during combat,
            NULL_UNIT_FOLLOW_UP_NODE,
            // and also,
            // if unit is within 4 spaces of a certain target ally,
            IF_NODE(IS_TARGET_WITHIN_N_SPACES_OF_TARGETS_ALLY_NODE(4,
                    // (If support partner is on player team,
                    // targets any support partner; otherwise,
                    // targets ally with the highest Spd on player team,
                    // excluding unit.)
                    OR_NODE(
                        AND_NODE(
                            IS_THERE_SKILL_OWNERS_PARTNER_ON_MAP_NODE,
                            ARE_TARGET_AND_SKILL_OWNER_PARTNERS_NODE
                        ),
                        AND_NODE(
                            NOT_NODE(IS_THERE_SKILL_OWNERS_PARTNER_ON_MAP_NODE),
                            HIGHEST_SPD_ALLIES_ON_MAP_NODE,
                        ),
                    )),
                // unit attacks twice during combat.
                TARGET_ATTACKS_TWICE_EVEN_IF_TARGETS_FOE_INITIATES_COMBAT_NODE,
            ),
        ),
    ));
}
{
    let skillId = getSpecialRefinementSkillId(Weapon.SilesseFrost);
    // At start of player phase or enemy phase,
    let nodeFunc = () => SKILL_EFFECT_NODE(
        // if unit is within 2 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_2_SPACES_OF_TARGETS_ALLY_NODE,
            // to unit and allies within 2 spaces of unit for 1 turn.
            FOR_EACH_TARGET_AND_TARGETS_ALLY_WITHIN_2_SPACES_OF_TARGET_NODE(
                // grants Atk/Spd+6,
                GRANTS_ATK_SPD_TO_TARGET_ON_MAP_NODE(6),
                // "Special cooldown charge +1 per attack during combat
                // (only highest value applied; does not stack)," and
                // (Dodge)
                GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(
                    StatusEffectType.SpecialCooldownChargePlusOnePerAttack,
                    StatusEffectType.Dodge,
                )
            ),
        ),
    );
    AT_START_OF_TURN_HOOKS.addSkill(skillId, nodeFunc);
    AT_START_OF_ENEMY_PHASE_HOOKS.addSkill(skillId, nodeFunc);
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // If unit is within 3 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_TARGETS_ALLY_NODE,
            // grants bonus to unit's Atk/Spd/Def/Res =
            GRANTS_BONUS_TO_TARGETS_ATK_SPD_DEF_RES_NODE(
                // 10% of unit's Spd at start of combat + 5 and deals
                ADD_NODE(
                    PERCENTAGE_NODE(10, UNITS_SPD_AT_START_OF_COMBAT_NODE),
                    5,
                ),
            ),
            // damage = 20% of unit's Spd during combat
            // (excluding area-of-effect Specials).
            DEALS_DAMAGE_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS(20, UNITS_SPD_DURING_COMBAT_NODE),
        ),
    ));
}

// Wind Sword Style
{
    let skillId = getStyleSkillId(STYLE_TYPE.WIND_SWORD);
    // Unit can attack foes 2 spaces away (unit cannot attack adjacent foes).
    // Unit suffers a counterattack if any of the following conditions are met: foe is armored with Range = 1,
    // foe can counterattack regardless of unit's range,
    // or foe's Range is the same as the distance between unit and foe.
    // After-combat movement effects do not occur.
    // Skill effect's Range is treated as 1, including by skill effects determined by attack Range, like Pavise and Aegis.
    // This Style can be used only once per turn.
    RANGED_STYLE_FOR_MELEE_SET.add(STYLE_TYPE.WIND_SWORD);
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        IF_NODE(EQ_NODE(TARGETS_CURRENT_STYLE_NODE, STYLE_TYPE.WIND_SWORD),
            // Calculates damage using the lower of foe's Def or Res during combat (excluding area-of-effect Specials).
            CALCULATES_DAMAGE_USING_THE_LOWER_OF_FOES_DEF_OR_RES_NODE,
        ),
    ));
    CAN_ACTIVATE_STYLE_HOOKS.addSkill(skillId, () => TRUE_NODE);
}

// Azure Twin Edge
{
    let skillId = Weapon.AzureTwinEdge;
    // Mt: 16
    // Rng: 1
    // Accelerates Special trigger (cooldown count-1).

    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // At start of turn,
        // if unit is within 2 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_2_SPACES_OF_TARGETS_ALLY_NODE,
            // to unit and allies within 2 spaces for 1 turn:
            FOR_EACH_TARGET_AND_TARGETS_ALLY_WITHIN_2_SPACES_OF_TARGET_NODE(
                // grants [Empathy] and the following status
                // "grants Special cooldown charge +1 per attack during combat (only highest value applied; does not stack)
                GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(
                    StatusEffectType.Empathy, StatusEffectType.SpecialCooldownChargePlusOnePerAttack),
            ),
        ),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // If unit initiates combat or if unit is within 2 spaces of an ally,
        IF_UNIT_INITIATES_COMBAT_OR_IS_WITHIN_2_SPACES_OF_AN_ALLY(
            // grants bonus to unit's Atk/Spd/Def/Res =
            // number of allies within 3 rows or 3 columns centered on unit x 3, + 5 (max 14),
            GRANTS_ALL_STATS_PLUS_N_TO_TARGET_DURING_COMBAT_NODE(
                ENSURE_MAX_NODE(
                    ADD_NODE(MULT_NODE(NUM_OF_ALLIES_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_UNIT_NODE, 3), 5),
                    14
                ),
            ),
            // deals damage = 20% of unit's Spd
            // (excluding area-of-effect Specials),
            DEALS_DAMAGE_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS(20, UNITS_SPD_DURING_COMBAT_NODE),
            // reduces damage from foe's first attack by 20% of unit's Spd
            // ("first attack" normally means only the first strike; for effects that grant "unit attacks twice," it means the first and second strikes),
            REDUCES_DAMAGE_FROM_FOES_FIRST_ATTACK_BY_PERCENTAGE_OF_TARGETS_STAT_DURING_COMBAT_INCLUDING_TWICE_NODE(
                20, UNITS_SPD_DURING_COMBAT_NODE),
            // and neutralizes effects that guarantee foe's follow-up attacks and effects that prevent unit's follow-up attacks during combat.
            NULL_UNIT_FOLLOW_UP_NODE,
        ),
    ));
    // Unit can use the following [Style] :
    // Wind Sword Style
    SKILL_STYLE_MAP.set(skillId, STYLE_TYPE.WIND_SWORD);
}

// Twin Strike
{
    let skillId = Special.TwinStrike;
    setSpecialCount(3);
    NORMAL_ATTACK_SPECIAL_SET.add(skillId);

    WHEN_APPLIES_SPECIAL_EFFECTS_AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // Boosts damage by 60% of unit's Spd when Special triggers.
        BOOSTS_DAMAGE_WHEN_SPECIAL_TRIGGERS_NODE(PERCENTAGE_NODE(60, UNITS_SPD_DURING_COMBAT_NODE)),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // Unit attacks twice (even if foe initiates combat, unit attacks twice) and
        TARGET_ATTACKS_TWICE_EVEN_IF_TARGETS_FOE_INITIATES_COMBAT_NODE,
        // neutralizes effects that inflict "Special cooldown charge -X on unit during combat.
        NEUTRALIZES_EFFECTS_THAT_INFLICT_SPECIAL_COOLDOWN_CHARGE_MINUS_X_ON_UNIT,
    ));
    AT_APPLYING_ONCE_PER_COMBAT_DAMAGE_REDUCTION_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // If unit's or foe's Special is ready or triggered before or during this combat,
        IF_NODE(IF_UNITS_OR_FOES_SPECIAL_IS_READY_OR_UNITS_OR_FOES_SPECIAL_TRIGGERED_BEFORE_OR_DURING_COMBAT_NODE,
            // reduces damage from foe's next attack by 40% (once per combat; excluding area-of-effect Specials).
            REDUCES_DAMAGE_FROM_TARGETS_FOES_NEXT_ATTACK_BY_N_PERCENT_ONCE_PER_COMBAT_NODE(40),
        ),
    ));
}

// Blue Skies 4
{
    let skillId = PassiveA.BlueSkies4;
    // Enables [Canto (2)] .
    enablesCantoN(skillId, 2);
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // If unit initiates combat or is within 2 spaces of an ally,
        IF_UNIT_INITIATES_COMBAT_OR_IS_WITHIN_2_SPACES_OF_AN_ALLY(
            // grants Atk/Spd+8 to unit,
            GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE(8, 8, 0, 0),
            X_NUM_NODE(
                // unit deals +X damage (excluding area-of-effect Specials),
                UNIT_DEALS_DAMAGE_EXCLUDING_AOE_SPECIALS_NODE(READ_NUM_NODE),
                // and reduces damage from foe's first attack by X during combat
                // "first attack" normally means only the first strike; for effects that grant "unit attacks twice," it means the first and second strikes).
                REDUCES_DAMAGE_FROM_FOES_FIRST_ATTACK_BY_N_DURING_COMBAT_INCLUDING_TWICE_NODE(READ_NUM_NODE),
                // (X = number of allies within 3 rows or 3 columns centered on unit x 2, + 2; max 8;
                ENSURE_MAX_NODE(
                    ADD_NODE(MULT_NODE(NUM_OF_ALLIES_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_UNIT_NODE, 2), 2),
                    8
                ),
            ),
        ),
    ));
}

// Emblem Effect
{
    let skillId = getEmblemHeroSkillId(EmblemHero.Eirika);
    // Enhanced Engaged Special:
    WHEN_APPLIES_SPECIAL_EFFECTS_AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // When Special triggers,
        // boosts damage by unit's max Special cooldown count value x 4 (excluding area-of-effect Specials).
        BOOSTS_DAMAGE_WHEN_SPECIAL_TRIGGERS_NODE(MULT_NODE(TARGETS_MAX_SPECIAL_COUNT_NODE, 4)),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // (triggers only when unit's Range = 1; does not trigger when equipped with an area-of-effect Special).
        IF_NODE(AND_NODE(EQ_NODE(TARGETS_RANGE_NODE, 1), NOT_NODE(HAS_TARGET_AOE_SPECIAL_NODE)),
            IF_NODE(
                // If it is unit's first combat initiated by unit or first combat initiated by foe that turn,
                IS_IT_TARGETS_FIRST_COMBAT_INITIATED_BY_TARGET_OR_FIRST_COMBAT_INITIATED_BY_TARGETS_FOE_IN_PLAYER_PHASE_OR_ENEMY_PHASE_NODE,
                // inflicts Atk-4 on unit and
                INFLICTS_STAT_MINUS_AT_ON_TARGET_DURING_COMBAT_NODE(STATUS_INDEX.Atk, 4),
                // unit attacks twice during combat
                TARGET_ATTACKS_TWICE_EVEN_IF_TARGETS_FOE_INITIATES_COMBAT_NODE,
            ),
        ),
    ));
}

// Arcane Medusa
{
    let skillId = Weapon.ArcaneMedusa;
    // Mt: 14
    // Rng: 2
    // Accelerates Special trigger (cooldown count-1).
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // At start of turn,
        // if unit's HP ≥ 25%,
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_TURN_NODE(
            // grants (Anathema) to unit for 1 turn.
            GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.Anathema),
        ),
    ));
    let [dealsDamageBeforeCombat, dealsDamageDuringCombat] =
        DEALS_DAMAGE_PERCENTAGE_OF_TARGETS_STAT_NODES(STATUS_INDEX.Atk, 15);
    BEFORE_AOE_SPECIAL_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // deals damage = 15% of unit's Atk (including area-of-effect Specials),
        dealsDamageBeforeCombat,
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // At start of combat,
        // if unit's HP ≥ 25%,
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE(
            // grants bonus to
            // unit's Atk/Spd/Def/Res = 25% of foe's Atk at start of combat - 4 (max 14; min 5),
            GRANTS_ALL_STATS_PLUS_N_TO_TARGET_DURING_COMBAT_NODE(
                ENSURE_MAX_NODE(
                    SUB_NODE(PERCENTAGE_NODE(25, FOES_ATK_AT_START_OF_COMBAT_NODE), 4),
                    5,
                    14
                ),
            ),
            // deals damage = 15% of unit's Atk (including area-of-effect Specials),
            dealsDamageDuringCombat,
            // reduces damage from foe's first attack by 7
            // ("first attack" normally means only the first strike; for effects that grant "unit attacks twice, " it means the first and second strikes),
            REDUCES_DAMAGE_FROM_FOES_FIRST_ATTACK_BY_N_DURING_COMBAT_INCLUDING_TWICE_NODE(7),
            // and grants Special cooldown count-1 to unit before unit's first attack during combat.
            GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_N_TO_TARGET_BEFORE_TARGETS_FIRST_ATTACK_DURING_COMBAT_NODE(1),
        ),
    ));
}

// Mounting Fear
{
    let skillId = PassiveB.MountingFear;
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // At start of turn,
        // on foes with Res < unit's Res and that are within 2 spaces of another foe through their next actions.
        FOR_EACH_UNIT_NODE(
            FILTER_UNITS_NODE(SKILL_OWNERS_FOES_ON_MAP_NODE,
                AND_NODE(
                    LT_NODE(TARGETS_EVAL_RES_ON_MAP, SKILL_OWNERS_EVAL_RES_ON_MAP),
                    TARGETS_FOES_THAT_ARE_WITHIN_N_SPACES_OF_ANOTHER_TARGETS_FOE_NODE(2))),
            // inflicts (Panic), (Exposure) , and [Deep Wounds)
            INFLICTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(
                StatusEffectType.Panic, StatusEffectType.Exposure, StatusEffectType.DeepWounds),
        ),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // Inflicts Atk/Res-5 on foe,
        INFLICTS_STATS_MINUS_ON_FOE_DURING_COMBAT_NODE(5, 0, 0, 5),
        // deals damage = 20% of unit's Res (excluding area-of-effect Specials),
        DEALS_DAMAGE_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS(20, UNITS_RES_DURING_COMBAT_NODE),
        // and reduces the percentage of foe's non-Special "reduce damage by X%" skills by 50% during combat (excluding area-of-effect Specials),
        REDUCES_PERCENTAGE_OF_TARGETS_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE,
        // and also,
    ));
    AT_START_OF_ATTACK_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // for unit's first attack during combat,
        IF_NODE(IS_TARGETS_FIRST_ATTACK_NODE,
            // if damage dealt prior to damage reduction calculation < foe's HP - 1,
            // sets damage before damage reduction as foe's HP - 1
            SET_TARGETS_BANE_PER_ATTACK_NODE,
            // (excluding area-of-effect Specials; excluding certain foes, such as Rokkr).
        ),
    ));
}

// Time Pulse Helm
{
    let skillId = PassiveC.TimePulseHelm;
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // At start of turn,
        // if unit's Special cooldown count is at its maximum value,
        // grants Special cooldown count-1 to unit.
        IF_TARGETS_SPECIAL_COOLDOWN_COUNT_IS_AT_ITS_MAXIMUM_VALUE_GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_X_NODE(1),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        X_NUM_NODE(
            // Grants bonus to unit's Atk/Res during combat = unit's
            GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE(READ_NUM_NODE, 0, 0, READ_NUM_NODE),
            // maximum Special cooldown count value + 2,
            ADD_NODE(TARGETS_MAX_SPECIAL_COUNT_NODE, 2),
        ),
        // and also,
        // if unit's Special cooldown count is at its maximum value after combat,
        // grants Special cooldown count-1 to unit.
        GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_1_IF_COUNT_IS_MAX_AFTER_COMBAT_NODE,
    ));
}

// Prior's Tome
{
    let skillId = Weapon.PriorsTome;
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE());
    // Mt: 14 Rng:2
    // Accelerates Special trigger (cooldown count-1).
    ALLY_CAN_MOVE_TO_A_SPACE_HOOKS.addSkill(skillId, () =>
        UNITE_SPACES_NODE(
            // Allies within 2 spaces of unit can move to any space within 2 spaces of unit.
            SPACES_WITHIN_M_SPACES_OF_SKILL_OWNER_WITHIN_N_SPACES_NODE(2, 2),
            // If unit is within 2 spaces of a trap in Aether Raids,
            SPACES_IF_NODE(
                IS_THERE_SPACES(SPACES_WITHIN_N_SPACES_OF_SKILL_OWNER_NODE(2), HAS_TARGET_SPACE_TRAP_NODE),
                // allies on the map can move to a space within 2 spaces of unit
                // ("trap in Aether Raids" includes any trap-triggered, disarmed, false, or otherwise).
                SPACES_WITHIN_N_SPACES_OF_SKILL_OWNER_NODE(2),
            ),
        ),
    );

    // For allies within 2 spaces of unit,
    setForAlliesHooks(skillId, IS_TARGET_WITHIN_2_SPACES_OF_SKILL_OWNER_NODE,
        // grants Atk/Res+5 and
        GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE(5, 0, 0, 5),
        SKILL_EFFECT_NODE(
            // neutralizes penalties to Atk/Res during their combat,
            new NeutralizesPenaltiesToUnitsStatsNode(true, false, false, true),
            // and restores 7 HP after combat.
            RESTORES_7_HP_TO_UNIT_AFTER_COMBAT_NODE,
        ),
    );

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // If unit is within 3 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_TARGETS_ALLY_NODE,
            X_NUM_NODE(
                // grants bonus to unit's Atk/Res = 20% of unit's Res at start of combat + 6,
                GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE(READ_NUM_NODE, 0, 0, READ_NUM_NODE),
                ADD_NODE(PERCENTAGE_NODE(20, UNITS_RES_AT_START_OF_COMBAT_NODE), 6),
            ),
            // neutralizes unit's penalties to Atk/Res,
            new NeutralizesPenaltiesToUnitsStatsNode(true, false, false, true),
            // deals damage = 20% of unit's Res (excluding area-of-effect Specials),
            DEALS_DAMAGE_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS(20, UNITS_RES_DURING_COMBAT_NODE),
            // and unit makes a guaranteed follow-up attack during combat,
            UNIT_MAKES_GUARANTEED_FOLLOW_UP_ATTACK_NODE,
            // and restores 7 HP to unit after combat.
            RESTORES_7_HP_TO_UNIT_AFTER_COMBAT_NODE,
        ),
    ));
}

// Hexblade Sword +
{
    let skillId = Weapon.HexbladeSwordPlus;
    // Mt: 14
    // Rng: 1
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // At start of turn,
        // if unit is within 2 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_2_SPACES_OF_TARGETS_ALLY_NODE,
            // grants "unit cannot be slowed by terrain (does not apply to impassable terrain)" and [Hexblade) to unit for 1 turn.
            GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(
                StatusEffectType.UnitCannotBeSlowedByTerrain, StatusEffectType.Hexblade),
        ),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // If unit initiates combat or is within 2 spaces of an ally,
        IF_UNIT_INITIATES_COMBAT_OR_IS_WITHIN_2_SPACES_OF_AN_ALLY(
            // grants Atk/Spd/Def/Res+5 to unit during combat and
            GRANTS_ALL_STATS_PLUS_5_TO_TARGET_DURING_COMBAT_NODE,
            // deals damage = 10% of unit's Atk (excluding area-of-effect Specials).
            DEALS_DAMAGE_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS(10, UNITS_ATK_DURING_COMBAT_NODE),
        ),
    ));
}

// True-Bond Bow
{
    let skillId = Weapon.TrueBondBow;
    // Mt: 14
    // Rng:2
    // Eff: E
    // Accelerates Special trigger (cooldown count-1).
    // Effective against flying foes.
    // Unit can move to a space within 2 spaces of any ally within 2 spaces.
    setSkillThatUnitCanMoveToAnySpaceWithinNSpacesOfAnAllyWithinMSpacesOfUnit(skillId, 2, 2);

    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // At start of turn,
        // if unit is within 2 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_2_SPACES_OF_TARGETS_ALLY_NODE,
            // for unit and allies within 2 spaces of unit,
            FOR_EACH_TARGET_AND_TARGETS_ALLY_WITHIN_2_SPACES_OF_TARGET_NODE(
                // grants Atk/Spd (Great Talent) +2,
                GRANTS_GREAT_TALENTS_PLUS_TO_TARGET_NODE(
                    StatsNode.makeStatsNodeFrom(2, 2, 0, 0),
                    StatsNode.makeStatsNodeFrom(10, 10, 10, 10),
                ),
                // and also,
                // if Special cooldown count is at its maximum value,
                IF_NODE(IS_TARGETS_SPECIAL_COOLDOWN_COUNT_IS_AT_ITS_MAXIMUM_NODE,
                    // grants Special cooldown count-2;
                    GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_ON_TARGET_ON_MAP_NODE(2),
                ),
                // if Special cooldown count is at its maximum value - 1,
                IF_NODE(EQ_NODE(TARGETS_SPECIAL_COOLDOWN_COUNT_ON_MAP_NODE, SUB_NODE(TARGETS_MAX_SPECIAL_COUNT_NODE, 1)),
                    // grants Special cooldown count-1.
                    GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_ON_TARGET_ON_MAP_NODE(1),
                ),
            ),
        ),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // If unit initiates combat or is within 2 spaces of an ally,
        IF_UNIT_INITIATES_COMBAT_OR_IS_WITHIN_2_SPACES_OF_AN_ALLY(
            // grants bonus to unit's Atk/Spd/Def/Res =
            GRANTS_ALL_STATS_PLUS_N_TO_TARGET_DURING_COMBAT_NODE(
                // number of allies within 3 rows or 3 columns centered on unit x 3, + 5 (max 14),
                ENSURE_MAX_NODE(
                    ADD_NODE(MULT_NODE(NUM_OF_ALLIES_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_UNIT_NODE, 3), 5),
                    14,
                ),
            ),
            X_NUM_NODE(
                // unit deals +X damage (excluding area-of-effect Specials),
                UNIT_DEALS_DAMAGE_EXCLUDING_AOE_SPECIALS_NODE(READ_NUM_NODE),
                // and reduces damage from foe's first attack by X during combat
                REDUCES_DAMAGE_FROM_FOES_FIRST_ATTACK_BY_N_DURING_COMBAT_INCLUDING_TWICE_NODE(READ_NUM_NODE),
                // (X = total value of Atk and Spd [Great Talent) × 2; max 30;
                // "first attack" normally means only the first strike; for effects that grant "unit attacks twice," it means the first and second strikes),
                ENSURE_MAX_NODE(
                    MULT_NODE(ADD_NODE(UNITS_ATK_GREAT_TALENT_NODE, UNITS_SPD_GREAT_TALENT_NODE), 2),
                    30,
                ),
            ),
            // and restores 7 HP to unit after combat.
            RESTORES_7_HP_TO_UNIT_AFTER_COMBAT_NODE,
            // (This skill grants max of (Great Talent) +10 for unit.)
        ),
    ));
}

// True Lunar Flash
{
    let skillId = Special.TrueLunarFlash;
    setSpecialCount(skillId, 3);
    NORMAL_ATTACK_SPECIAL_SET.add(skillId);

    // When Special triggers,
    WHEN_APPLIES_SPECIAL_EFFECTS_AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // treats foe's Def/Res as if reduced by 35%,
        TREATS_TARGETS_FOES_DEF_RES_AS_IF_REDUCED_BY_X_PERCENT_NODE(35),
        // boosts damage by 35% of unit's Spd,
        BOOSTS_DAMAGE_WHEN_SPECIAL_TRIGGERS_NODE(PERCENTAGE_NODE(35, UNITS_SPD_DURING_COMBAT_NODE)),
        // neutralizes "reduces damage by X%" effects from foe's non-Special skills,
        WHEN_SPECIAL_TRIGGERS_NEUTRALIZES_FOES_REDUCES_DAMAGE_BY_PERCENTAGE_EFFECTS_FROM_FOES_NON_SPECIAL_EXCLUDING_AOE_SPECIALS_NODE,
    ));
    AT_START_OF_ATTACK_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        IF_NODE(CAN_ACTIVATE_ATTACKER_SPECIAL_NODE,
            // and prevents foe's Specials that are triggered by unit's attack.
            PREVENTS_TARGETS_FOES_SPECIALS_THAT_ARE_TRIGGERED_BY_TARGETS_ATTACK_NODE,
        ),
    ));
    AT_APPLYING_ONCE_PER_COMBAT_DAMAGE_REDUCTION_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit's or foe's Special is ready or triggered before or during this combat,
        IF_NODE(IF_UNITS_OR_FOES_SPECIAL_IS_READY_OR_UNITS_OR_FOES_SPECIAL_TRIGGERED_BEFORE_OR_DURING_COMBAT_NODE,
            // reduces damage from foe's next attack by 40% (once per combat; excluding area-of-effect Specials).
            new ReducesDamageFromTargetsFoesNextAttackByNPercentOncePerCombatNode(40),
        ),
    ));
}

// Pulse On: Blades
{
    let skillId = PassiveC.PulseOnBlades;
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        X_NUM_NODE(
            // Grants bonus to unit's Atk/Spd =
            GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE(READ_NUM_NODE, READ_NUM_NODE, 0, 0),
            // unit's max Special cooldown count value + 2,
            ADD_NODE(TARGETS_MAX_SPECIAL_COUNT_NODE, 2),
        ),
        // and if unit's attack can trigger unit's Special,
        IF_NODE(CAN_TARGETS_ATTACK_TRIGGER_TARGETS_SPECIAL_NODE,
            // grants Special cooldown count-2 to unit before unit's first follow-up attack during combat.
            GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_N_TO_TARGET_BEFORE_TARGETS_FIRST_FOLLOW_UP_ATTACK_DURING_COMBAT_NODE(2),
        ),
    ));
}

// Lull Echo
{
    let skillId = PassiveX.LullEcho;
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE());
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // Inflicts penalty on foe's Atk/Spd/Def/Res =
        INFLICTS_ALL_STATS_MINUS_N_ON_FOE_DURING_COMBAT_NODE(
            // number of (Bonus) effects active on foe (max 4; excluding stat bonuses),
            ENSURE_MAX_NODE(NUM_OF_BONUSES_ACTIVE_ON_FOE_EXCLUDING_STAT_NODE, 4)
        ),
        // and neutralizes foe's bonuses during combat.
        NEUTRALIZES_FOES_BONUSES_TO_STATS_DURING_COMBAT_NODE,
    ));
}

// Gentle Fell Egg
{
    let skillId = Weapon.GentleFellEgg;
    // Mt: 14
    // Rng: 2
    // Accelerates Special trigger (cooldown count-1).
    // Grants HP+5,
    // Atk/Res+6.

    // At start of player phase or enemy phase,
    let nodeFunc = () => SKILL_EFFECT_NODE(
        // if unit is within 2 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_2_SPACES_OF_TARGETS_ALLY_NODE,
            // to unit and allies within 2 spaces of unit for 1 turn.
            FOR_EACH_TARGET_AND_TARGETS_ALLY_WITHIN_2_SPACES_OF_TARGET_NODE(
                // grants "reduces damage from area-of-effect Specials by 80% (excluding Rokkr area-of-effect Specials)," [Resonance: Blades) ,
                // and (Resonance: Shields)
                GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(
                    StatusEffectType.ReduceDamageFromAreaOfEffectSpecialsBy80Percent,
                    StatusEffectType.ResonantBlades,
                    StatusEffectType.ResonantShield
                ),
            ),
        ),
    );
    AT_START_OF_TURN_HOOKS.addSkill(skillId, nodeFunc);
    AT_START_OF_ENEMY_PHASE_HOOKS.addSkill(skillId, nodeFunc);
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit initiates combat or is within 2 spaces of an ally,
        IF_UNIT_INITIATES_COMBAT_OR_IS_WITHIN_2_SPACES_OF_AN_ALLY(
            X_NUM_NODE(
                // grants bonus to unit's Atk/Res = 20% of unit's Res at start of combat,
                GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE(READ_NUM_NODE, 0, 0, READ_NUM_NODE),
                PERCENTAGE_NODE(20, UNITS_RES_AT_START_OF_COMBAT_NODE),
            ),
            // deals damage = 20% of unit's Res (excluding area-of-effect Specials),
            DEALS_DAMAGE_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS(20, UNITS_RES_DURING_COMBAT_NODE),
            // and unit makes a guaranteed follow-up attack during combat,
            UNIT_MAKES_GUARANTEED_FOLLOW_UP_ATTACK_NODE,
            // and also,
            APPLY_SKILL_EFFECTS_AFTER_STATUS_FIXED_NODE(
                // if unit's Res ≥ foe's Res+ 10,
                IF_NODE(GTE_NODE(UNITS_EVAL_RES_DURING_COMBAT_NODE, ADD_NODE(FOES_EVAL_RES_DURING_COMBAT_NODE, 10)),
                    // unit attacks twice during combat.
                    TARGET_ATTACKS_TWICE_EVEN_IF_TARGETS_FOE_INITIATES_COMBAT_NODE,
                ),
            ),
        ),
    ));
}

// A/R Far Resound
{
    let skillId = PassiveB.ARFarResound;
    // Enables (Canto (Rem.; Min 1)) •
    enablesCantoRemPlusMin(skillId, 0, 1);
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // Inflicts Atk/Res-4 on foe,
        INFLICTS_STATS_MINUS_ON_FOE_DURING_COMBAT_NODE(4, 0, 0, 4),
    ));
    setResonance(skillId);
}

// Fell Majesty
{
    let skillId = PassiveC.FellMajesty;
    // Disables foe's "calculate damage using the lower of foe's Def or Res" effects (including area-of-effect Specials).
    DISABLES_FOES_SKILLS_THAT_CALCULATE_DAMAGE_USING_THE_LOWER_OF_FOES_DEF_OR_RES_SET.add(skillId);

    FOR_ALLIES_GRANTS_STATS_PLUS_TO_ALLIES_DURING_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // For allies within 2 spaces of unit,
        IF_NODE(IS_TARGET_WITHIN_2_SPACES_OF_SKILL_OWNER_NODE,
            // grants Atk/Def/Res+5
            GRANTS_STAT_PLUS_AT_TO_TARGET_DURING_COMBAT_NODE(5, 0, 5, 5),
        ),
    ));
    FOR_ALLIES_GRANTS_EFFECTS_TO_ALLIES_DURING_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // For allies within 2 spaces of unit,
        IF_NODE(IS_TARGET_WITHIN_2_SPACES_OF_SKILL_OWNER_NODE,
            // and reduces damage from foe's first attack by 7 during their combat
            // ("first attack" normally means only the first strike; for effects that grant "unit attacks twice," it means the first and second strikes).
            REDUCES_DAMAGE_FROM_FOES_FIRST_ATTACK_BY_N_DURING_COMBAT_INCLUDING_TWICE_NODE(7),
        ),
    ));
    FOR_ALLIES_GRANTS_EFFECTS_TO_ALLIES_AFTER_OTHER_SKILLS_DURING_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // For allies within 2 spaces of unit,
        IF_NODE(IS_TARGET_WITHIN_2_SPACES_OF_SKILL_OWNER_NODE,
            // if this unit's Res ≥ ally's foe's Res+5 at start of combat,
            IF_NODE(GTE_NODE(SKILL_OWNERS_EVAL_RES_ON_MAP, ADD_NODE(FOES_EVAL_RES_AT_START_OF_COMBAT_NODE, 5)),
                // and if foe's attack can trigger foe's Special,
                IF_NODE(CAN_FOES_ATTACK_TRIGGER_FOES_SPECIAL_NODE,
                    // inflicts Special cooldown count+ 1 on
                    // foe before foe's first attack,
                    INFLICTS_SPECIAL_COOLDOWN_COUNT_PLUS_N_ON_TARGETS_FOE_BEFORE_TARGETS_FOES_FIRST_ATTACK_NODE(1),
                    // and also,
                    // if foe's Range = 2,
                    IF_NODE(FOES_RANGE_IS_2_NODE,
                        // inflicts additional Special cooldown count+ 1 on foe before foe's first follow-up attack (cannot exceed the foe's maximum Special cooldown).
                        INFLICTS_SPECIAL_COOLDOWN_COUNT_PLUS_N_ON_TARGETS_FOE_BEFORE_TARGETS_FOES_FIRST_FOLLOW_UP_ATTACK_NODE(1),
                    ),
                ),
            ),
        ),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit initiates combat or is within 2 spaces of an ally,
        IF_UNIT_INITIATES_COMBAT_OR_IS_WITHIN_2_SPACES_OF_AN_ALLY(
            // inflicts Atk/Res-5 on foe,
            INFLICTS_STAT_MINUS_AT_ON_FOE_DURING_COMBAT_NODE(5, 0, 0, 5),
            // reduces damage from foe's first attack by 7
            // ("first attack" normally means only the first strike; for effects that grant "unit attacks twice," it means the first and second strikes),
            REDUCES_DAMAGE_FROM_FOES_FIRST_ATTACK_BY_N_DURING_COMBAT_INCLUDING_TWICE_NODE(7),
            // and grants Special cooldown charge +1 to unit per attack during combat (only highest value applied; does not stack),
            GRANTS_SPECIAL_COOLDOWN_CHARGE_PLUS_1_TO_UNIT_PER_ATTACK_DURING_COMBAT_NODE,
            // and also,
            APPLY_SKILL_EFFECTS_AFTER_STATUS_FIXED_NODE(
                // if unit's Res ≥ foe's Res+5 and foe's attack can trigger foe's Special,
                IF_NODE(AND_NODE(
                        GTE_NODE(UNITS_EVAL_RES_DURING_COMBAT_NODE, ADD_NODE(FOES_EVAL_RES_DURING_COMBAT_NODE, 5)),
                        CAN_FOES_ATTACK_TRIGGER_FOES_SPECIAL_NODE),
                    // inflicts Special cooldown count+1 on foe before foe's first attack,
                    INFLICTS_SPECIAL_COOLDOWN_COUNT_PLUS_N_ON_TARGETS_FOE_BEFORE_TARGETS_FOES_FIRST_ATTACK_NODE(1),
                ),
            ),
            // and also,
            // if foe's Range = 2,
            IF_NODE(FOES_RANGE_IS_2_NODE,
                // inflicts additional Special cooldown count+ 1 on foe before foe's first follow-up attack
                INFLICTS_SPECIAL_COOLDOWN_COUNT_PLUS_N_ON_TARGETS_FOE_BEFORE_TARGETS_FOES_FIRST_FOLLOW_UP_ATTACK_NODE(1),
                // (cannot exceed the foe's maximum Special cooldown).
            ),
        ),
    ));
}

// Petaldream Horn
{
    let skillId = Weapon.PetaldreamHorn;
    // Mt: 14
    // Rng: 1
    // Accelerates Special trigger (cooldown count-1).
    WHEN_INFLICTS_STATS_MINUS_TO_FOES_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // For foes within 3 rows or 3 columns centered on unit,
        IF_NODE(IS_TARGET_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_SKILL_OWNER_NODE,
            // inflicts Atk/Spd/Def/Res-5
            INFLICTS_ALL_STATS_MINUS_5_ON_FOE_DURING_COMBAT_NODE,
            // if those foes have bonuses,
            // inflicts a penalty on those foes' Atk/Spd/Def/Res and grants a bonus to foes' combat
            // targets' Atk/Spd/Def/Res during combat = current bonus
            // on each of that foe's stats (calculates each stat bonus and penalty independently).
            FOR_EACH_STAT_INDEX_NODE(
                INFLICTS_STAT_MINUS_AT_ON_FOE_DURING_COMBAT_NODE(READ_NUM_NODE, FOES_BONUS_NODE(READ_NUM_NODE)),
                GRANTS_STAT_PLUS_AT_TO_UNIT_DURING_COMBAT_NODE(READ_NUM_NODE, FOES_BONUS_NODE(READ_NUM_NODE)),
            ),
        ),
    ));
    WHEN_INFLICTS_EFFECTS_TO_FOES_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // For foes within 3 rows or 3 columns centered on unit,
        IF_NODE(IS_TARGET_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_SKILL_OWNER_NODE,
            // and Special cooldown charge -1 on those foes per attack during combat (only highest value applied; does not stack),
            INFLICTS_SPECIAL_COOLDOWN_CHARGE_MINUS_1_ON_FOE_NODE,
        ),
    ));

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of combat,
        // if unit's HP ≥ 25%,
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE(
            // grants bonus to
            // unit's Atk/Spd/Def/Res = number of foes within 3 rows or 3 columns centered on unit x 3 (max 9),
            GRANTS_ALL_STATS_PLUS_N_TO_UNIT_DURING_COMBAT_NODE(
                ENSURE_MAX_NODE(NUM_OF_FOES_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_UNIT_NODE, 9)
            ),
            // deals damage = 20% of unit's Spd (excluding area-of-effect Specials),
            DEALS_DAMAGE_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS(20, UNITS_SPD_DURING_COMBAT_NODE),
            // and reduces damage from foe's first attack by 20% of unit's Spd during combat
            // ("first attack" normally means only the first strike; for effects that grant "unit attacks twice," it means the first and second strikes),
            REDUCES_DAMAGE_FROM_FOES_FIRST_ATTACK_BY_PERCENTAGE_OF_TARGETS_STAT_DURING_COMBAT_INCLUDING_TWICE_NODE(
                20, UNITS_SPD_DURING_COMBAT_NODE,
            ),
            // and restores 7 HP to unit after combat.
            RESTORES_7_HP_TO_UNIT_AFTER_COMBAT_NODE,
        ),
    ));
    // At start of turn,
    // if unit is adjacent to only beast or dragon allies or if unit is not adjacent to any ally,
    // unit transforms (otherwise,
    // unit reverts). If unit transforms,
    // grants Atk+2,
    // and also,
    // inflicts Atk/Def-X on foe during combat (X = number of spaces from start position to end position of whoever initiated combat + 3; max 6),
    // and also,
    // if X ≥ 5,
    // reduces damage from foe's first attack by 30% during combat.\
    setBeastSkill(skillId, BeastCommonSkillType.Cavalry2);
}

// Nihility's Undoing
{
    let skillId = PassiveA.NihilitysUndoing;
    // If unit can transform,
    // transformation effects gain "if unit is within 2 spaces of a beast or dragon ally,
    // or if number of adjacent allies other than beast or dragon allies ≤ 2" as a trigger condition (in addition to existing conditions).
    setEffectThatTransformationEffectsGainAdditionalTriggerCondition(skillId);

    // If defending in Aether Raids,
    // at the start of enemy turn 1,
    // if conditions for transforming are met,
    // unit transforms.
    setEffectThatIfDefendingInARAtStartOfEnemyTurn1UnitTransforms(skillId);

    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode());
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit is transformed or if foe's HP ≥ 75% at start of combat,
        IF_NODE(OR_NODE(IS_TARGET_TRANSFORMED_NODE, IS_FOES_HP_GTE_75_PERCENT_AT_START_OF_COMBAT_NODE),
            // grants Atk/Spd/Def/Res+X+8 to unit
            GRANTS_ALL_STATS_PLUS_8_TO_TARGET_DURING_COMBAT_NODE,
            // and reduces damage from foe's attacks by X x 4 during combat
            // (X = number of spaces from start position to
            // end position of whoever initiated combat; max 3; excluding area-of-effect Specials),
            X_NUM_NODE(
                REDUCES_DAMAGE_FROM_TARGETS_FOES_ATTACKS_BY_X_DURING_COMBAT_NODE(MULT_NODE(READ_NUM_NODE, 4)),
                // and also,
                // when foe's attack triggers foe's Special,
                IF_NODE(CAN_FOES_ATTACK_TRIGGER_FOES_SPECIAL_NODE,
                    // reduces damage by an additional X x 4 (excluding area-of-effect Specials).
                    REDUCES_DAMAGE_FROM_TARGETS_FOES_ATTACKS_BY_X_DURING_COMBAT_NODE(MULT_NODE(READ_NUM_NODE, 4)),
                ),
                ENSURE_MAX_NODE(NUMBER_OF_SPACES_FROM_START_POSITION_TO_END_POSITION_OF_WHOEVER_INITIATED_COMBAT, 3),
            ),
        ),
        // If unit is transformed or if foe's HP ≥ 75% at start of combat,
        IF_NODE(OR_NODE(IS_TARGET_TRANSFORMED_NODE, IS_FOES_HP_GTE_75_PERCENT_AT_START_OF_COMBAT_NODE),
            // grants Special cooldown charge + 1 to unit per attack (only highest value applied; does not stack)
            GRANTS_SPECIAL_COOLDOWN_CHARGE_PLUS_1_TO_UNIT_PER_ATTACK_DURING_COMBAT_NODE,
            // and reduces the percentage of foe's non-Special "reduce damage by X%" skills by 50% during combat (excluding area-of-effect Specials).
            REDUCES_PERCENTAGE_OF_TARGETS_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE,
        ),
    ));
}

// Bestial Agility
{
    let skillId = PassiveB.BestialAgility;
    // Enables (Canto (Rem. +1; Min 2)] while transformed.
    enablesCantoRemPlusMin(skillId, 1, 2);
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit is transformed or unit's HP ≥ 25% at start of combat,
        IF_NODE(OR_NODE(IS_TARGET_TRANSFORMED_NODE, IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE),
            // inflicts Spd/Def-4 on foe and
            INFLICTS_STATS_MINUS_ON_FOE_DURING_COMBAT_NODE(0, 4, 4, 0),
            // deals damage = 20% of the greater of unit's Spd or Def (excluding area-of-effect Specials),
            DEALS_DAMAGE_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS(20,
                MAX_NODE(UNITS_SPD_DURING_COMBAT_NODE, UNITS_DEF_DURING_COMBAT_NODE)),
            // and also,
            APPLY_SKILL_EFFECTS_AFTER_STATUS_FIXED_NODE(
                // if unit's Spd > foe's Spd,
                IF_NODE(GT_NODE(UNITS_EVAL_SPD_DURING_COMBAT_NODE, FOES_EVAL_SPD_DURING_COMBAT_NODE),
                    // neutralizes effects that guarantee foe's follow-up attacks and effects that prevent unit's follow-up attacks during combat.
                    NULL_UNIT_FOLLOW_UP_NODE,
                ),
            ),
        ),
    ));
}

// Spring-Air Egg+
{
    let setSkill = skillId => {
        // Mt: 12 Rng:2
        // on foes within 3 rows or 3 columns centered on unit
        WHEN_INFLICTS_STATS_MINUS_TO_FOES_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
            // Inflicts Atk/Spd/Def/Res-5
            INFLICTS_ALL_STATS_MINUS_5_ON_FOE_DURING_COMBAT_NODE,
        ));
        // on foes within 3 rows or 3 columns centered on unit
        WHEN_INFLICTS_EFFECTS_TO_FOES_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
            // and neutralizes effects that grant "Special cooldown charge +X" to those foes during their combat.
            NEUTRALIZES_EFFECTS_THAT_GRANT_SPECIAL_COOLDOWN_CHARGE_PLUS_X_TO_FOE,
        ));

        AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
            // At start of combat,
            // if unit's HP ≥ 25%,
            IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE(
                X_NUM_NODE(
                    // unit deals +X × 5 damage during combat
                    UNIT_DEALS_DAMAGE_EXCLUDING_AOE_SPECIALS_NODE(MULT_NODE(READ_NUM_NODE, 5)),
                    // (max 20; X = number of foes within 3 spaces of target, including target; excluding area-of-effect Specials).
                    ENSURE_MAX_NODE(NUM_OF_TARGETS_FOES_WITHIN_3_SPACES_OF_TARGET_NODE, 20),
                ),
            ),
        ));
    };
    setSkill(Weapon.SpringAirEggPlus);
    setSkill(Weapon.SpringAirAxePlus);
}

// Springing Spear
{
    let skillId = Weapon.SpringingSpear;
    // Mt: 16
    // Rng: 1
    // Enables (Canto (Rem. + 1; Min 2)] .
    enablesCantoRemPlusMin(skillId, 1, 2);
    // Grants Res+3.
    FOR_ALLIES_GRANTS_STATS_PLUS_TO_ALLIES_DURING_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // For allies within 3 rows or 3 columns centered on unit,
        IF_NODE(IS_TARGET_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_SKILL_OWNER_NODE,
            // grants Atk/Def/Res+5,
            GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE(5, 0, 5, 5),
        ),
    ));
    FOR_ALLIES_GRANTS_EFFECTS_TO_ALLIES_DURING_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // For allies within 3 rows or 3 columns centered on unit,
        IF_NODE(IS_TARGET_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_SKILL_OWNER_NODE,
            // ally deals +10 damage (excluding area-of-effect Specials),
            UNIT_DEALS_DAMAGE_EXCLUDING_AOE_SPECIALS_NODE(10),
            // and grants Special cooldown count-1 to ally before ally's first attack during their combat.
            GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_N_TO_TARGET_BEFORE_TARGETS_FIRST_ATTACK_DURING_COMBAT_NODE(1),
        ),
    ));
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // At start of turn,
        // to allies within 2 spaces of unit for 1 turn.
        FOR_TARGETS_ALLIES_WITHIN_2_SPACES_OF_TARGET_NODE(
            // grants [Canto (1)]
            GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.Canto1),
        ),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // If there is an ally within 3 rows or 3 columns centered on unit,
        IF_NODE(IS_THERE_ALLY_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_UNIT_NODE,
            // inflicts penalty on foe's Atk/Def = 20% of unit's Res at start of combat + 6,
            X_NUM_NODE(
                INFLICTS_STATS_MINUS_ON_FOE_DURING_COMBAT_NODE(READ_NUM_NODE, 0, READ_NUM_NODE, 0),
                ADD_NODE(PERCENTAGE_NODE(20, UNITS_RES_AT_START_OF_COMBAT_NODE), 6),
            ),
            // unit deals + 10 damage (excluding area-of-effect Specials),
            UNIT_DEALS_DAMAGE_EXCLUDING_AOE_SPECIALS_NODE(10),
            // reduces damage from foe's attacks by 10 (excluding area-of-effect Specials),
            REDUCES_DAMAGE_FROM_TARGETS_FOES_ATTACKS_BY_X_DURING_COMBAT_NODE(10),
            // and foe cannot make a follow-up attack during combat.
            FOE_CANNOT_MAKE_FOLLOW_UP_ATTACK_NODE,
        ),
    ));
}

// Dreamlike Night
{
    let skillId = Support.DreamlikeNight;
    // Rng: 1
    // Grants another action to target ally,
    REFRESH_SUPPORT_SKILL_SET.add(skillId);
    // and if Canto has already been triggered by target ally, re-enables Canto.
    AFTER_REFRESH_SKILL_IS_USED_BY_UNIT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        RE_ENABLES_CANTO_TO_ASSIST_TARGET_ON_MAP_NODE,
        // on closest foes to target ally and any foe within 2 spaces of those foes through their next actions (cannot target an ally with Sing or Dance; this skill treated as Sing or Dance).
        FOR_EACH_ASSIST_TARGETS_CLOSEST_FOE_AND_ANY_FOE_WITHIN_2_SPACES_OF_THOSE_FOES_NODE(
            // Inflicts Atk/Def/Res-7,
            INFLICTS_STATS_MINUS_ON_TARGET_ON_MAP_NODE(7, 0, 7, 7),
            // [Frozen] ,
            INFLICTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.Frozen),
            // and (Sabotage)
            INFLICTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.Sabotage),
        ),
    ));
}

// SpringAirAxePlus
{
    let skillId = Weapon.SpringAirAxePlus;
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE());
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
    ));
}

// Inflicts Atk/Spd/Def/Res-5 on foes within 3 rows or 3 columns centered on unit and neutralizes effects that grant "Special cooldown charge +X" to those foes during their combat.
// At start of combat,
// if unit's HP ≥ 25%,
// unit deals +X × 5 damage during combat (max 20; X = number of foes within 3 spaces of target,
// including target; excluding area-of-effect Specials).

{
    let skillId = PassiveC.HolyGroundPlus;
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode());
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
    ));
}

{
    let skillId = PassiveB.FaithfulLoyalty2;
    const X = HIGHEST_TOTAL_BONUSES_TO_AMONG_UNIT_AND_ALLIES_WITHIN_N_SPACES_NODE(2, TARGETS_TOTAL_BONUSES_NODE);
    let [reduceDamageBeforeCombat, reduceDamageDuringCombat] =
        REDUCES_DAMAGE_BY_N_NODES(X);
    const IS_FOE_ARMOR_OR_CAVALRY_NODE =
        OR_NODE(
            EQ_NODE(FOE_MOVE_NODE, MoveType.Armor),
            EQ_NODE(FOE_MOVE_NODE, MoveType.Cavalry)
        );
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // 重装、騎馬の敵から攻撃された時、先制攻撃
        IF_NODE(AND_NODE(
                DOES_FOE_INITIATE_COMBAT_NODE,
                IS_FOE_ARMOR_OR_CAVALRY_NODE),
            TARGET_CAN_COUNTERATTACK_BEFORE_TARGETS_FOES_FIRST_ATTACK_NODE,
        ),
        // 戦闘中、敵の攻撃、速さ、守備一5、敵の絶対追撃を無効、かつ、自分の追撃不可を無効、
        INFLICTS_STATS_MINUS_ON_FOE_DURING_COMBAT_NODE(5, 5, 5, 0),
        NULL_UNIT_FOLLOW_UP_NODE,
        // 敵が重装、騎馬の時、受けるダメージー〇
        // （範囲奥義を含む（巨影の範囲奥義は除く））、
        IF_ELSE_NODE(IS_FOE_ARMOR_OR_CAVALRY_NODE,
            reduceDamageDuringCombat,
            // 敵が重装、騎馬でない時、戦闘中、最初に受けた攻撃と2回攻撃のダメージー〇の40%
            // （〇は、自分と周囲2マス以内にいる味方のうち強化の合計値が最も高い値）
            REDUCES_DAMAGE_FROM_FOES_FIRST_ATTACK_BY_N_DURING_COMBAT_INCLUDING_TWICE_NODE(
                PERCENTAGE_NODE(40, X)),
        ),
        // 戦闘後、7回復、
        RESTORES_7_HP_TO_UNIT_AFTER_COMBAT_NODE,
    ));
    AFTER_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // 自分に【待ち伏せ】を付与（1ターン）
        GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.Vantage),
    ));
    BEFORE_AOE_SPECIAL_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        IF_NODE(IS_FOE_ARMOR_OR_CAVALRY_NODE,
            reduceDamageBeforeCombat,
        ),
    ));
}

// Harmonized Skill
{
    let skillId = Hero.HarmonizedPlumeria;
    WHEN_TRIGGERS_DUO_OR_HARMONIZED_EFFECT_HOOKS_MAP.addValue(skillId,
        SKILL_EFFECT_NODE(
            FOR_EACH_UNIT_FROM_SAME_TITLES_NODE(
                // Grants [Resonance: Blades) to unit and allies from the same titles as unit for 1 turn.
                GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.ResonantBlades),
            ),
            // If unit has not entered combat on the current turn,
            IF_NODE(NOT_NODE(HAS_TARGET_ENTERED_COMBAT_DURING_CURRENT_TURN_NODE),
                // grants another action to unit, and if Canto has already been triggered, re-enables Canto.
                GRANTS_ANOTHER_ACTION_TO_TARGET_ON_MAP_NODE,
                RE_ENABLES_CANTO_TO_TARGET_ON_MAP_NODE,
            ),
        ),
    );
}

// 虚ろな槍
{
    let skillId = getNormalSkillId(Weapon.BereftLance);
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // 戦闘中、自身の攻撃、守備が周囲2マス以内の味方の数によって最大+6上昇
        // (味方が0体なら+6、1体なら+4、2体なら+2、3体以上なら+0)
        X_NUM_NODE(
            IF_NODE(EQ_NODE(READ_NUM_NODE, 0),
                GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE(6, 0, 6, 0),
            ),
            IF_NODE(EQ_NODE(READ_NUM_NODE, 1),
                GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE(4, 0, 4, 0),
            ),
            IF_NODE(EQ_NODE(READ_NUM_NODE, 2),
                GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE(2, 0, 2, 0),
            ),
            NUM_OF_TARGETS_ALLIES_WITHIN_2_SPACES_NODE,
        ),
        // 周囲2マス以内の味方が1体以下の時、戦闘中、敵の強化の+を無効にする(無効になるのは、鼓舞や応援等の+効果)
        IF_NODE(LTE_NODE(NUM_OF_TARGETS_ALLIES_WITHIN_2_SPACES_NODE, 1),
            NEUTRALIZES_FOES_BONUSES_TO_STATS_DURING_COMBAT_NODE,
        ),
    ));
}
{
    let skillId = getRefinementSkillId(Weapon.BereftLance);
    // Grants Def+3.
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        X_NUM_NODE(
            // Grants Atk/Spd/Def/Res+X to unit
            GRANTS_ATK_SPD_DEF_RES_TO_TARGET_DURING_COMBAT_NODE(READ_NUM_NODE),
            // (calculates X based on number of allies adjacent to unit:
            // 	•	0 allies grants +10
            // 	•	1 ally grants +8
            // 	•	2 allies grants +6
            // 	•	≥3 allies grants +4),
            COND_OP(EQ_NODE(NUM_OF_TARGETS_ALLIES_WITHIN_1_SPACES_NODE, 0),
                10,
                COND_OP(EQ_NODE(NUM_OF_TARGETS_ALLIES_WITHIN_1_SPACES_NODE, 1),
                    8,
                    COND_OP(EQ_NODE(NUM_OF_TARGETS_ALLIES_WITHIN_1_SPACES_NODE, 2),
                        6,
                        4,
                    ),
                ),
            )
        ),
        // neutralizes foe’s bonuses,
        NEUTRALIZES_FOES_BONUSES_TO_STATS_DURING_COMBAT_NODE,
        // and reduces damage from foe’s attacks by 20% of unit’s Def during combat (excluding area-of-effect Specials).
        REDUCES_DAMAGE_FROM_FOES_FIRST_ATTACK_BY_PERCENTAGE_OF_TARGETS_STAT_DURING_COMBAT_INCLUDING_TWICE_NODE(
            20, UNITS_DEF_DURING_COMBAT_NODE,
        ),
    ));
}
{
    let skillId = getSpecialRefinementSkillId(Weapon.BereftLance);
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of turn, if unit’s HP ≥ 25%,
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_TURN_NODE(
            // on closest foes and any foes within 2 spaces of those foes through their next actions.
            FOR_EACH_TARGETS_CLOSEST_FOE_AND_ANY_FOE_WITHIN_2_SPACES_OF_THOSE_FOES_NODE(
                // inflicts Atk/Def-7 and (Exposure)
                INFLICTS_ATK_DEF_ON_TARGET_ON_MAP_NODE(7),
                INFLICTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.Exposure),
            ),
        ),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of combat, if unit’s HP ≥ 25%,
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE(
            // grants Atk/Spd/Def/Res+5 to unit,
            GRANTS_ALL_STATS_PLUS_5_TO_TARGET_DURING_COMBAT_NODE,
            // unit makes a guaranteed follow-up attack during combat,
            UNIT_MAKES_GUARANTEED_FOLLOW_UP_ATTACK_NODE,
            // and restores 7 HP to unit after combat.
            RESTORES_7_HP_TO_UNIT_AFTER_COMBAT_NODE,
        ),
    ));
}

// 慕炎の書
{
    let skillId = getNormalSkillId(Weapon.SparkingTome);
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        IF_NODE(IS_FOES_HP_GTE_50_PERCENT_AT_START_OF_COMBAT_NODE,
            INFLICTS_STATS_MINUS_ON_FOE_DURING_COMBAT_NODE(0, 6, 0, 6),
            FOR_EACH_TARGET_STAT_INDEX_NODE([STATUS_INDEX.Spd, STATUS_INDEX.Res],
                INFLICTS_STAT_MINUS_AT_ON_FOE_DURING_COMBAT_NODE(
                    READ_NUM_NODE,
                    MULT_NODE(FOES_BONUS_NODE(READ_NUM_NODE), 2)),
            ),
        ),
    ));
}
{
    let skillId = getRefinementSkillId(Weapon.SparkingTome);
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit initiates combat or foe’s HP ≥ 50% at start of combat,
        IF_NODE(OR_NODE(DOES_UNIT_INITIATE_COMBAT_NODE, IS_FOES_HP_GTE_50_PERCENT_AT_START_OF_COMBAT_NODE),
            // inflicts Atk-5 and Spd/Res-6 on foe,
            INFLICTS_ATK_ON_FOE_DURING_COMBAT_NODE(5),
            INFLICTS_SPD_RES_ON_FOE_DURING_COMBAT_NODE(6),
            // inflicts penalty on foe’s Atk/Spd/Res = current bonus on each of foe’s stats × 2
            // (calculates each stat penalty independently),
            FOR_EACH_TARGET_STAT_INDEX_NODE([STATUS_INDEX.Atk, STATUS_INDEX.Spd, STATUS_INDEX.Res],
                INFLICTS_STAT_MINUS_AT_ON_FOE_DURING_COMBAT_NODE(
                    READ_NUM_NODE,
                    MULT_NODE(FOES_BONUS_NODE, 2))
            ),
            // neutralizes effects that grant “Special cooldown charge +X” to foe or inflict “Special cooldown charge -X” on unit during combat,
            NEUTRALIZES_EFFECTS_THAT_GRANT_SPECIAL_COOLDOWN_CHARGE_PLUS_X_TO_FOE,
            NEUTRALIZES_EFFECTS_THAT_INFLICT_SPECIAL_COOLDOWN_CHARGE_MINUS_X_ON_UNIT,
            // and also, if decreasing the Spd difference necessary to make a follow-up attack by 25 would allow unit to trigger a follow-up attack (excluding guaranteed or prevented follow-ups),
            // triggers [Potent Follow X%] during combat
            // (if unit cannot perform follow-up and attack twice, X = 80; otherwise, X = 40).
            APPLY_POTENT_EFFECT_NODE,
        ),
    ));
}
{
    let skillId = getSpecialRefinementSkillId(Weapon.SparkingTome);
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of turn, if unit is within 2 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_2_SPACES_OF_TARGETS_ALLY_NODE,
            // to unit and allies within 2 spaces of unit for 1 turn.
            FOR_EACH_TARGET_AND_TARGETS_ALLY_WITHIN_2_SPACES_OF_TARGET_NODE(
                // grants Atk/Spd+6,
                GRANTS_ATK_SPD_TO_TARGET_ON_MAP_NODE(6),
                // and grants
                // “reduces the percentage of foe’s non-Special ‘reduce damage by X%’ skills by 50% during combat (excluding area-of-effect Specials)”
                GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(
                    StatusEffectType.ReducesPercentageOfFoesNonSpecialReduceDamageSkillsBy50Percent),
            ),
        ),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit initiates combat or is within 2 spaces of an ally,
        IF_UNIT_INITIATES_COMBAT_OR_IS_WITHIN_2_SPACES_OF_AN_ALLY(
            // inflicts Atk/Spd/Res-5 on foe,
            INFLICTS_ATK_SPD_RES_ON_FOE_DURING_COMBAT_NODE(5),
            // deals damage = 20% of unit’s Spd (excluding area-of-effect Specials),
            DEALS_DAMAGE_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS(20, UNITS_SPD_DURING_COMBAT_NODE),
            // and reduces damage from foe’s first attack by 7 during combat
            // (“first attack” normally means only the first strike; for effects that grant “unit attacks twice,” it means the first and second strikes).
            REDUCES_DAMAGE_FROM_FOES_FIRST_ATTACK_BY_N_DURING_COMBAT_INCLUDING_TWICE_NODE(7),
        ),
    ));
}

// ルーン
{
    let skillId = getNormalSkillId(Weapon.Luin);
    let [dealsDamageBeforeCombat, dealsDamageDuringCombat] =
        DEALS_DAMAGE_PERCENTAGE_OF_TARGETS_STAT_NODES(STATUS_INDEX.Spd, 20);
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        IF_UNIT_INITIATES_COMBAT_OR_IS_WITHIN_2_SPACES_OF_AN_ALLY(
            dealsDamageDuringCombat,
            GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE(0, 6, 0, 0),
            APPLY_SKILL_EFFECTS_AFTER_STATUS_FIXED_NODE(
                IF_NODE(GTE_NODE(UNITS_EVAL_SPD_DURING_COMBAT_NODE, ADD_NODE(FOES_EVAL_SPD_DURING_COMBAT_NODE, 5)),
                    FOE_CANNOT_COUNTERATTACK_NODE,
                ),
            ),
        ),
    ));
    BEFORE_AOE_SPECIAL_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        IF_UNIT_INITIATES_COMBAT_OR_IS_WITHIN_2_SPACES_OF_AN_ALLY(
            dealsDamageBeforeCombat,
        ),
    ));
}
{
    let skillId = getRefinementSkillId(Weapon.Luin);
    // Accelerates Special trigger (cooldown count -1).
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode());
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit initiates combat or is within 2 spaces of an ally,
        IF_UNIT_INITIATES_COMBAT_OR_IS_WITHIN_2_SPACES_OF_AN_ALLY(
            // grants Atk/Spd+6 to unit,
            GRANTS_ATK_SPD_TO_TARGET_DURING_COMBAT_NODE(6),
            // deals damage = 20% of unit’s Spd during combat (including area-of-effect Specials),
            DEALS_DAMAGE_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS(20, UNITS_SPD_DURING_COMBAT_NODE),
            APPLY_SKILL_EFFECTS_AFTER_STATUS_FIXED_NODE(
                // and also, when Special triggers,
                // deals additional damage = 20% of unit’s Spd (including area-of-effect Specials).
                DEALS_DAMAGE_WHEN_TRIGGERING_SPECIAL_DURING_COMBAT_PER_ATTACK_NODE(
                    PERCENTAGE_NODE(20, UNITS_SPD_DURING_COMBAT_NODE),
                ),
                // If unit’s Spd ≥ foe’s Spd -7 during combat,
                IF_NODE(GTE_NODE(UNITS_EVAL_SPD_NODE, SUB_NODE(FOES_EVAL_SPD_NODE, 7)),
                    // foe cannot counterattack.
                    FOE_CANNOT_COUNTERATTACK_NODE,
                ),
            ),
        ),
    ));
}
{
    let skillId = getSpecialRefinementSkillId(Weapon.Luin);
    // Enables [Canto (2)]
    enablesCantoN(skillId, 2);
    // on foes within 3 rows or 3 columns centered on unit,
    WHEN_INFLICTS_STATS_MINUS_TO_FOES_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        IF_NODE(IS_TARGET_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_SKILL_OWNER_NODE,
            // Inflicts Spd/Def-5
            INFLICTS_SPD_DEF_ON_FOE_DURING_COMBAT_NODE(5),
        ),
    ));
    WHEN_INFLICTS_EFFECTS_TO_FOES_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        IF_NODE(IS_TARGET_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_SKILL_OWNER_NODE,
            // neutralizes those foes’ bonuses to Spd/Def,
            NEUTRALIZES_FOES_EACH_BONUSES_TO_STATS_DURING_COMBAT_NODE(false, true, true, false),
            // and those foes suffer guaranteed follow-up attacks during combat.
            FOE_SUFFERS_GUARANTEED_FOLLOW_UP_ATTACKS_DURING_COMBAT,
        ),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of combat, if unit’s HP ≥ 25%,
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE(
            // grants Atk/Spd+6 to unit,
            GRANTS_ATK_SPD_TO_TARGET_DURING_COMBAT_NODE(6),
            // neutralizes effects that inflict “Special cooldown charge -X” on unit,
            NEUTRALIZES_EFFECTS_THAT_INFLICT_SPECIAL_COOLDOWN_CHARGE_MINUS_X_ON_UNIT,
            // and grants Special cooldown count -1 to unit before unit’s first attack during combat.
            GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_N_TO_TARGET_BEFORE_TARGETS_FIRST_ATTACK_DURING_COMBAT_NODE(1),
        ),
    ));
}

// 業火の双斧
{
    let skillId = getNormalSkillId(Weapon.TwinStarAxe);
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE(MULT_TRUNC_NODE(TARGETS_TOTAL_BONUSES_NODE, 0.5), 0, 0, 0),
    ));
}
{
    let skillId = getRefinementSkillId(Weapon.TwinStarAxe);
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // Inflicts Spd-5 and grants Atk/Def/Res+5.
        INFLICTS_SPD_ON_FOE_DURING_COMBAT_NODE(5),
        GRANTS_ATK_DEF_RES_TO_TARGET_DURING_COMBAT_NODE(5),
        // Unit attacks twice.
        // (Even if foe initiates combat, unit attacks twice).
        TARGET_ATTACKS_TWICE_EVEN_IF_TARGETS_FOE_INITIATES_COMBAT_NODE,
        X_NUM_NODE(
            // Grants Atk+X to unit,
            GRANTS_ATK_TO_TARGET_DURING_COMBAT_NODE(READ_NUM_NODE),
            // inflicts Atk-X on foe,
            INFLICTS_ATK_ON_FOE_DURING_COMBAT_NODE(READ_NUM_NODE),
            // and unit makes a guaranteed follow-up attack during combat
            UNIT_MAKES_GUARANTEED_FOLLOW_UP_ATTACK_NODE,
            // (X = highest total bonuses among unit and allies within 3 spaces of unit).
            HIGHEST_TOTAL_BONUSES_AMONG_UNIT_AND_ALLIES_WITHIN_N_SPACES_NODE(3),
        ),
    ));
}
{
    let skillId = getSpecialRefinementSkillId(Weapon.TwinStarAxe);
    // Enables【Canto (2)】.
    enablesCantoN(skillId, 2);
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of turn,
        // if unit is within 2 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_2_SPACES_OF_TARGETS_ALLY_NODE,
            // to unit and allies within 2 spaces of unit for 1 turn.
            FOR_EACH_TARGET_AND_TARGETS_ALLY_WITHIN_2_SPACES_OF_TARGET_NODE(
                // grants Atk/Def+6,
                GRANTS_ATK_DEF_TO_TARGET_DURING_COMBAT_NODE(6),
                // “neutralizes foe’s bonuses during combat,”
                // and【Null Panic】
                GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(
                    StatusEffectType.NeutralizesFoesBonusesDuringCombat,
                    StatusEffectType.NullPanic),
            ),
        ),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit is within 3 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_TARGETS_ALLY_NODE,
            // grants Atk+6 to unit,
            GRANTS_ATK_TO_TARGET_DURING_COMBAT_NODE(6),
            // inflicts Atk-6 on foe,
            INFLICTS_ATK_ON_FOE_DURING_COMBAT_NODE(6),
            // and reduces the percentage of foe’s non-Special “reduce damage by X%” skills by 50% during combat (excluding area-of-effect Specials),
            REDUCES_PERCENTAGE_OF_TARGETS_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE,
            // and restores 7 HP to unit after combat.
            RESTORES_7_HP_TO_UNIT_AFTER_COMBAT_NODE,
        ),
    ));
}

// キアの杖
{
    let skillId = getNormalSkillId(Weapon.KiaStaff);
    let APPLY_KIA_NODE = unitsNode =>
        FOR_EACH_UNIT_NODE(LOWEST_HP_UNITS_NODE(unitsNode),
            GRANTS_STATS_PLUS_TO_TARGET_ON_MAP_NODE(6, 6, 0, 0),
            NEUTRALIZES_ANY_PENALTY_ON_TARGET_NODE,
        );
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of turn,
        // if【Penalty】is active on any allies within 4 spaces of unit (excluding unit),
        // grants Atk/Spd+6 to ally with the lowest HP among them for 1 turn and neutralizes any【Penalty】on that ally
        // (excluding penalties inflicted at start of turn).
        // (If【Penalty】is not active on any ally within 4 spaces of unit, targets ally with the lowest HP among them instead.)
        IF_NODE(IS_TARGET_WITHIN_4_SPACES_OF_TARGETS_ALLY_NODE,
            IF_ELSE_NODE(
                IS_THERE_UNITS_IF(SKILL_OWNERS_ALLIES_WITHIN_4_SPACES, IS_PENALTY_ACTIVE_ON_TARGET_NODE),
                // 不利な状態の味方がいる場合
                APPLY_KIA_NODE(FILTER_UNITS_NODE(SKILL_OWNERS_ALLIES_WITHIN_4_SPACES, IS_PENALTY_ACTIVE_ON_TARGET_NODE)),
                // 不利な状態の味方がいない場合
                APPLY_KIA_NODE(SKILL_OWNERS_ALLIES_WITHIN_4_SPACES),
            ),
        ),
    ));
}
{
    let skillId = getRefinementSkillId(Weapon.KiaStaff);
    // Calculates damage from staff like other weapons.
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of turn, if unit is within 3 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_TARGETS_ALLY_NODE,
            // to unit and allies within 3 spaces of unit for 1 turn,
            FOR_EACH_TARGET_AND_TARGETS_ALLY_WITHIN_3_SPACES_OF_TARGET_NODE(
                // grants Atk/Spd+6 and Hexblade
                GRANTS_ATK_SPD_TO_TARGET_ON_MAP_NODE(6),
                GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.Hexblade),
                // neutralizes any (Penalty) effects on unit and allies within 3 spaces of unit
                // (excluding penalties inflicted at start of turn).
                NEUTRALIZES_ANY_PENALTY_ON_TARGET_NODE
            ),
        ),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit is within 3 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_TARGETS_ALLY_NODE,
            // grants Atk/Spd/Def/Res+5 to unit,
            GRANTS_ATK_SPD_DEF_RES_TO_TARGET_DURING_COMBAT_NODE(5),
            // deals damage = 15% of foe’s Atk (excluding area-of-effect Specials;
            // if the “calculates damage from staff like other weapons” effect is neutralized,
            // damage from staff is calculated after combat damage is added),
            DEALS_DAMAGE_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS(15, UNITS_ATK_DURING_COMBAT_NODE),
            // and grants Special cooldown charge +1 to unit per attack during combat
            // (only highest value applied; does not stack).
            GRANTS_SPECIAL_COOLDOWN_CHARGE_PLUS_1_TO_UNIT_PER_ATTACK_DURING_COMBAT_NODE,
        ),
    ));
}
{
    let skillId = getSpecialRefinementSkillId(Weapon.KiaStaff);
    // For allies within 3 rows or 3 columns centered on unit,
    WHEN_INFLICTS_STATS_MINUS_TO_FOES_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        IF_NODE(IS_TARGET_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_SKILL_OWNER_NODE,
            // grants Atk/Spd+5 during their combat,
            GRANTS_ATK_SPD_TO_TARGET_DURING_COMBAT_NODE(5),
        ),
    ));
    WHEN_INFLICTS_EFFECTS_TO_FOES_AFTER_OTHER_SKILLS_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        IF_NODE(IS_TARGET_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_SKILL_OWNER_NODE,
            // and also, if ally’s Spd > foe’s Spd,
            IF_NODE(GT_NODE(UNITS_EVAL_SPD_NODE, FOES_EVAL_SPD_NODE),
                // neutralizes effects that guarantee foe’s follow-up attacks
                // and effects that prevent ally’s follow-up attacks during their combat.
                NULL_UNIT_FOLLOW_UP_NODE,
            ),
        ),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of combat, if unit’s HP ≥ 25%,
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE(
            // grants Atk/Spd/Def/Res+5 to unit,
            GRANTS_ATK_SPD_DEF_RES_TO_TARGET_DURING_COMBAT_NODE(5),
            // neutralizes foe’s bonuses,
            NEUTRALIZES_FOES_BONUSES_TO_STATS_DURING_COMBAT_NODE,
            // neutralizes effects that guarantee foe’s follow-up attacks
            // and effects that prevent unit’s follow-up attacks during combat,
            NULL_UNIT_FOLLOW_UP_NODE,
            // and restores 7 HP to unit after combat.
            RESTORES_7_HP_TO_UNIT_AFTER_COMBAT_NODE,
        ),
    ));
}

// 聖女の杖
{
    let skillId = getNormalSkillId(Weapon.StaffOfTheSaint);
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        FOR_EACH_TARGETS_ALLY_WITHIN_2_SPACES_NODE(
            GRANTS_STATS_PLUS_TO_TARGET_ON_MAP_NODE(0, 0, 6, 6),
        ),
        // inflicts【False Start】on foes in cardinal directions of unit with Res < unit’s Res.
        FOR_EACH_UNIT_NODE(
            FILTER_UNITS_NODE(SKILL_OWNERS_FOES_ON_MAP_NODE,
                AND_NODE(
                    IS_TARGET_IN_CARDINAL_DIRECTIONS_OF_SKILL_OWNER_NODE,
                    LT_NODE(TARGETS_RES_ON_MAP, SKILL_OWNERS_RES_ON_MAP),
                ),
            ),
            INFLICTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.FalseStart),
        ),
    ));
}
{
    let skillId = getRefinementSkillId(Weapon.StaffOfTheSaint);
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of turn,
        // to unit and allies within 2 spaces of unit for 1 turn.
        FOR_EACH_TARGET_AND_TARGETS_ALLY_WITHIN_2_SPACES_OF_TARGET_NODE(
            // grants Def/Res+6 and (Bonus Doubler)
            GRANTS_DEF_RES_TO_TARGET_ON_MAP_NODE(6),
            GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.BonusDoubler),
        ),
        // At start of turn,
        // on foes in cardinal directions with Res < unit’s Res through their next actions.
        FOR_EACH_UNIT_NODE(
            FILTER_UNITS_NODE(TARGETS_FOES_ON_MAP_NODE,
                AND_NODE(
                    IS_TARGET_IN_CARDINAL_DIRECTIONS_OF_SKILL_OWNER_NODE,
                    LT_NODE(TARGETS_RES_ON_MAP, SKILL_OWNERS_RES_ON_MAP),
                ),
            ),
            // inflicts Atk/Res-7 and (False Start)
            INFLICTS_ATK_RES_ON_TARGET_ON_MAP_NODE(7),
            INFLICTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.FalseStart),
            // If False Start is inflicted at the same time that start-of-turn effects trigger for the opponent,
            // effects other than healing, damage, or Divine Vein will trigger simultaneously.
        ),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // Foe cannot counterattack.
        FOE_CANNOT_COUNTERATTACK_NODE,
        // If unit is within 3 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_TARGETS_ALLY_NODE,
            // grants Atk/Spd/Def/Res+5 to unit,
            GRANTS_ATK_SPD_DEF_RES_TO_TARGET_DURING_COMBAT_NODE(5),
            // neutralizes effects that guarantee foe’s follow-up attacks
            // and effects that prevent unit’s follow-up attacks,
            NULL_UNIT_FOLLOW_UP_NODE,
            // and deals damage = 20% of unit’s Res during combat
            // (excluding area-of-effect Specials; calculates damage from staff after combat damage is added).
            DEALS_DAMAGE_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS(20, UNITS_RES_DURING_COMBAT_NODE),
        ),
    ));
}
{
    let skillId = getSpecialRefinementSkillId(Weapon.StaffOfTheSaint);
    // Enables Canto (1).
    enablesCantoN(skillId, 1);
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If foe initiates combat or foe’s HP ≥ 75% at start of combat,
        IF_FOE_INITIATES_COMBAT_OR_IF_FOES_HP_GTE_75_PERCENT_AT_START_OF_COMBAT(
            // grants bonus to unit’s Atk/Spd/Def/Res =
            GRANTS_BONUS_TO_TARGETS_ATK_SPD_DEF_RES_NODE(
                // number of allies within 3 spaces of unit × 2, +5 (max 11),
                ENSURE_MAX_NODE(ADD_NODE(MULT_NODE(NUM_OF_TARGETS_ALLIES_WITHIN_3_SPACES_NODE, 2), 5), 11),
            ),
            // neutralizes penalties on unit,
            NEUTRALIZES_PENALTIES_ON_UNIT_NODE,
            // and grants Special cooldown charge +1 to unit per attack during combat
            // (only highest value applied; does not stack).
            GRANTS_SPECIAL_COOLDOWN_CHARGE_PLUS_1_TO_UNIT_PER_ATTACK_DURING_COMBAT_NODE,
        ),
    ));
}

// 扶翼ウイングスピア
{
    let skillId = getNormalSkillId(Weapon.WingLeftedSpear);
    enablesCantoN(skillId, 2);
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        IF_UNIT_INITIATES_COMBAT_OR_IS_WITHIN_2_SPACES_OF_AN_ALLY(
            GRANTS_ALL_STATS_PLUS_5_TO_TARGET_DURING_COMBAT_NODE,
            FOR_EACH_STAT_INDEX_NODE(
                GRANTS_STAT_PLUS_AT_TO_TARGET_DURING_COMBAT_NODE(READ_NUM_NODE, FOES_BONUS_NODE(READ_NUM_NODE)),
            ),
            FOR_EACH_STAT_INDEX_NODE(
                INFLICTS_STAT_MINUS_AT_ON_FOE_DURING_COMBAT_NODE(READ_NUM_NODE, FOES_BONUS_NODE(READ_NUM_NODE)),
            ),
        ),
    ));
}
{
    let skillId = getRefinementSkillId(Weapon.WingLeftedSpear);
    // Enables [Canto (2)]
    enablesCantoN(skillId, 2);
    // Grants Atk+3.
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode());
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // Effective against armored and cavalry foes.
        EFFECTIVE_AGAINST_NODE(EffectiveType.Armor),
        EFFECTIVE_AGAINST_NODE(EffectiveType.Cavalry),
        // If unit initiates combat or is within 2 spaces of an ally,
        IF_UNIT_INITIATES_COMBAT_OR_IS_WITHIN_2_SPACES_OF_AN_ALLY(
            // grants Atk/Spd/Def/Res+5 to unit,
            GRANTS_ATK_SPD_DEF_RES_TO_TARGET_DURING_COMBAT_NODE(5),
            FOR_EACH_STAT_INDEX_NODE(
                // grants Atk/Spd/Def/Res+X to unit,
                GRANTS_STAT_PLUS_AT_TO_TARGET_DURING_COMBAT_NODE(READ_NUM_NODE, FOES_BONUS_NODE(READ_NUM_NODE)),
                // inflicts Atk/Spd/Def/Res–X on foe during combat
                INFLICTS_STAT_MINUS_AT_ON_FOE_DURING_COMBAT_NODE(READ_NUM_NODE, FOES_BONUS_NODE(READ_NUM_NODE)),
                // (X = current bonus on each of foe’s stats; calculates each stat bonus and penalty independently),
            ),
            // and unit deals +Y damage during combat
            UNIT_DEALS_DAMAGE_EXCLUDING_AOE_SPECIALS_NODE(
                // (Y = number of Bonus effects active on unit and foe, excluding stat bonuses × 5; max 25; excluding area-of-effect Specials).
                ENSURE_MAX_NODE(
                    MULT_NODE(NUM_OF_BONUS_ON_UNIT_EXCLUDING_STAT_NODE, 5),
                    25,
                ),
            ),
        ),
    ));
}
{
    let skillId = getSpecialRefinementSkillId(Weapon.WingLeftedSpear);
    // Accelerates Special trigger (cooldown count -1).
    let nodeFunc = () => SKILL_EFFECT_NODE(
        // if unit is within 2 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_2_SPACES_OF_TARGETS_ALLY_NODE,
            // to unit and allies within 2 spaces of unit for 1 turn:
            FOR_EACH_TARGET_AND_TARGETS_ALLY_WITHIN_2_SPACES_OF_TARGET_NODE(
                // grants Atk/Spd+6 and
                GRANTS_ATK_SPD_TO_TARGET_ON_MAP_NODE(6),
                // the following statuses
                // “neutralizes unit’s penalties during combat”
                GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.NeutralizesPenalties),
                // and
                // “grants Special cooldown charge +1 per attack during combat
                // (only highest value applied; does not stack).”
                GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.SpecialCooldownChargePlusOnePerAttack),
            ),
        ),
    );
    // At start of player phase or enemy phase,
    AT_START_OF_ATTACK_HOOKS.addSkill(skillId, nodeFunc);
    AT_START_OF_ENEMY_PHASE_HOOKS.addSkill(skillId, nodeFunc);
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit initiates combat or is within 2 spaces of an ally,
        IF_UNIT_INITIATES_COMBAT_OR_IS_WITHIN_2_SPACES_OF_AN_ALLY(
            // grants bonus to unit’s Atk/Spd/Def/Res during combat =
            GRANTS_ATK_SPD_DEF_RES_TO_TARGET_DURING_COMBAT_NODE(
                // number of allies within 3 spaces of unit × 2, +5 (max 11),
                ENSURE_MAX_NODE(ADD_NODE(MULT_NODE(NUM_OF_TARGETS_ALLIES_WITHIN_3_SPACES_NODE, 2), 5), 11),
            ),
            // and reduces the percentage of foe’s non-Special “reduce damage by X%” skills by 50% during combat (excluding area-of-effect Specials).
            REDUCES_PERCENTAGE_OF_TARGETS_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE,
        ),
    ));
}

// [Salvage]
{
    let skillId = getStatusEffectSkillId(StatusEffectType.Salvage);
    // Enables [Canto (2)] .
    enablesCantoN(skillId, 2)

    // When [Canto Control] is applied to unit,
    CALCULATES_DISTANCE_OF_CANTO_WHEN_CANTO_CONTROL_IS_APPLIED_HOOKS.addSkill(skillId, () =>
        // if unit's Range = 1,
        // unit can move 2 spaces with Canto instead of 1 space,
        // and if unit's Range = 2,
        // unit can move 1 space with Canto instead of 0 spaces.
        COND_OP(IS_TARGET_MELEE_WEAPON_NODE,
            CONSTANT_NUMBER_NODE(2),
            CONSTANT_NUMBER_NODE(1),
        ),
    );
}

// Salvage
{
    let skillId = Weapon.Salvage;
    // Mt: 14
    // Rng: 2
    // Accelerates Special trigger (cooldown count-1; max cooldown count value cannot be reduced below 1).
    // Foe cannot counterattack.

    // For allies with the [Salvage] effect active,
    // when Canto triggers,
    // if ally is within 6 spaces of unit,
    // ally can move to a space within 2 spaces of unit,
    // even if that movement exceeds the Canto distance limit.
    WHEN_CANTO_ALLY_CAN_MOVE_TO_A_SPACE_HOOKS.addSkill(skillId, () =>
        SPACES_IF_NODE(
            AND_NODE(
                IS_TARGET_WITHIN_6_SPACES_OF_SKILL_OWNER_NODE,
                HAS_TARGET_STATUS_EFFECT_NODE(StatusEffectType.Salvage)),
            SPACES_WITHIN_N_SPACES_OF_SKILL_OWNER_NODE(2),
        ),
    );

    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of turn,
        // if unit is within 2 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_2_SPACES_OF_TARGETS_ALLY_NODE,
            // and the following status to unit and allies within 2 spaces of unit for 1 turn:
            FOR_EACH_TARGET_AND_TARGETS_ALLY_WITHIN_2_SPACES_OF_TARGET_NODE(
                // grants Atk/Spd+6,
                GRANTS_STATS_PLUS_TO_TARGET_ON_MAP_NODE(6, 6, 0, 0),
                // [Salvage],
                // "unit can move to a space adjacent to any ally within 2 spaces."
                GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.Salvage, StatusEffectType.AirOrders),
            ),
        ),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit initiates combat or is within 2 spaces of an ally,
        IF_UNIT_INITIATES_COMBAT_OR_IS_WITHIN_2_SPACES_OF_AN_ALLY(
            // grants bonus to unit's Atk/Spd = 20% of unit's Spd at start of combat + 6,
            X_NUM_NODE(
                GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE(READ_NUM_NODE, READ_NUM_NODE, 0, 0),
                ADD_NODE(PERCENTAGE_NODE(20, UNITS_SPD_AT_START_OF_COMBAT_NODE), 6),
            ),
            // deals damage = 15% of foe's Atk
            // (excluding area-of-effect Specials; calculates damage from staff after combat damage is added),
            DEALS_DAMAGE_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS(15, FOES_ATK_DURING_COMBAT_NODE),
            // neutralizes effects that guarantee foe's follow-up attacks and effects that prevent unit's follow-up attacks,
            NULL_UNIT_FOLLOW_UP_NODE,
            // and neutralizes effects that inflict "Special cooldown charge -X" on unit during combat.
            NEUTRALIZES_EFFECTS_THAT_INFLICT_SPECIAL_COOLDOWN_CHARGE_MINUS_X_ON_UNIT,
        ),
    ));
}

// Called to Serve
{
    let skillId = PassiveB.CalledToServe;
    // If a Rally or movement Assist skill is used by unit,
    let nodeFunc = () => new SkillEffectNode(
        // to unit, target ally, and allies within 2 spaces of target ally after movement for 1 turn.
        FOR_EACH_UNIT_NODE(
            UNITE_UNITS_NODE(
                UnitsNode.makeFromUnits(ASSIST_TARGETING_NODE, ASSIST_TARGET_NODE),
                ASSIST_TARGETS_ALLIES_WITHIN_2_SPACES_OF_TARGET_NODE(TRUE_NODE)
            ),
            // grants "neutralizes foe's bonuses during combat"
            GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.NeutralizesFoesBonusesDuringCombat),
        ),
    );
    AFTER_MOVEMENT_ASSIST_ENDED_BY_UNIT_HOOKS.addSkill(skillId, nodeFunc);
    AFTER_RALLY_SKILL_IS_USED_BY_UNIT_HOOKS.addSkill(skillId, nodeFunc);

    FOR_ALLIES_GRANTS_EFFECTS_TO_ALLIES_DURING_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // Allies on the map with the "neutralizes foe's bonuses during combat" status active
        IF_NODE(HAS_TARGET_STATUS_EFFECT_NODE(StatusEffectType.NeutralizesFoesBonusesDuringCombat),
            // deal +5 damage during combat (excluding area-of-effect Specials).
            UNIT_DEALS_DAMAGE_EXCLUDING_AOE_SPECIALS_NODE(5),
        ),
    ));

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // Inflicts Spd/Res-4 on foe and
        INFLICTS_STATS_MINUS_ON_FOE_DURING_COMBAT_NODE(0, 4, 0, 4),
        X_NUM_NODE(
            // unit deals +X damage during combat
            UNIT_DEALS_DAMAGE_EXCLUDING_AOE_SPECIALS_NODE(READ_NUM_NODE),
            // (X = number of allies on the map with "neutralizes foe's
            // bonuses during combat" status active,
            // excluding unit, × 5; max 15; excluding area-of-effect Specials).
            ENSURE_MAX_NODE(
                MULT_NODE(
                    COUNT_IF_UNITS_NODE(
                        TARGETS_ALLIES_ON_MAP_NODE,
                        HAS_TARGET_STATUS_EFFECT_NODE(StatusEffectType.NeutralizesFoesBonusesDuringCombat)),
                    5),
                15
            ),
        ),
    ));
}

// Quiet Strength
{
    let skillId = PassiveC.QuietStrength;
    // For allies on the map with the [Salvage] effect active and allies within 2 spaces of unit,
    FOR_ALLIES_GRANTS_STATS_PLUS_TO_ALLIES_DURING_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        IF_NODE(
            OR_NODE(
                HAS_TARGET_STATUS_EFFECT_NODE(StatusEffectType.Salvage),
                IS_TARGET_WITHIN_2_SPACES_OF_SKILL_OWNER_NODE
            ),
            // grants Atk/Spd/Def/Res+5,
            GRANTS_ALL_STATS_PLUS_5_TO_TARGET_DURING_COMBAT_NODE,
        ),
    ));
    // For allies on the map with the [Salvage] effect active and allies within 2 spaces of unit,
    FOR_ALLIES_GRANTS_EFFECTS_TO_ALLIES_DURING_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        IF_NODE(
            OR_NODE(
                HAS_TARGET_STATUS_EFFECT_NODE(StatusEffectType.Salvage),
                IS_TARGET_WITHIN_2_SPACES_OF_SKILL_OWNER_NODE
            ),
            // deals +7 damage (excluding area-of-effect Specials),
            UNIT_DEALS_DAMAGE_EXCLUDING_AOE_SPECIALS_NODE(7),
            // reduces damage from foe's first attack by 7
            // ("first attack" normally means only the first strike; for effects that grant "unit attacks twice," it means the first and second strikes),
            REDUCES_DAMAGE_FROM_FOES_FIRST_ATTACK_BY_N_DURING_COMBAT_INCLUDING_TWICE_NODE(7),
            // and grants Special cooldown count-1 to ally before ally's first attack during their combat.
            GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_N_TO_TARGET_BEFORE_TARGETS_FIRST_ATTACK_DURING_COMBAT_NODE(1),
        ),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit initiates combat or is within 2 spaces of an ally,
        IF_UNIT_INITIATES_COMBAT_OR_IS_WITHIN_2_SPACES_OF_AN_ALLY(
            // grants Atk/Spd+5,
            GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE(5, 5, 0, 0),
            // neutralizes penalties to unit's Atk/Spd,
            new NeutralizesPenaltiesToUnitsStatsNode(true, true, false, false),
            // deals +7 damage (excluding area-of-effect Specials),
            UNIT_DEALS_DAMAGE_EXCLUDING_AOE_SPECIALS_NODE(7),
            // reduces damage from foe's first attack by 7
            // ("first attack" normally means only the first strike; for effects that grant "unit attacks twice," it means the first and second strikes),
            REDUCES_DAMAGE_FROM_FOES_FIRST_ATTACK_BY_N_DURING_COMBAT_INCLUDING_TWICE_NODE(7),
            // grants Special cooldown count-1 to unit before unit's first attack,
            GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_N_TO_TARGET_BEFORE_TARGETS_FIRST_ATTACK_DURING_COMBAT_NODE(1),
            // and reduces the percentage of foe's non-Special "reduce damage by X%" skills by 50% during combat (excluding area-of-effect Specials).
            REDUCES_PERCENTAGE_OF_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE,
        ),
    ));
}

// Nova
{
    let skillId = Weapon.Nova;
    // Enables【Canto (Ally 5)】. Grants Atk+3.
    enablesCantoAlly(skillId, 5);

    // If unit initiates combat,
    // unit attacks twice.

    UNIT_CAN_MOVE_TO_A_SPACE_HOOKS.addSkill(skillId, () =>
        // For each foe within 5 spaces of unit,
        // unit can move to any of the nearest spaces that are two spaces away from that foe (unless space is impassable terrain).
        FOR_EACH_TARGETS_FOE_WITHIN_N_SPACES_OF_UNIT_ANY_OF_THE_NEAREST_SPACES_THAT_ARE_M_SPACES_AWAY_FROM_THAT_FOE_NODE(5, 2),
    );
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of turn,
        // on closest foes and any foes within 2 spaces of those foes through their next actions.
        FOR_EACH_TARGETS_CLOSEST_FOE_AND_ANY_FOE_WITHIN_2_SPACES_OF_THOSE_FOES_NODE(
            // inflicts Atk/Res-7 and 【Sabotage】
            INFLICTS_STATS_MINUS_ON_TARGET_ON_MAP_NODE(7, 0, 0, 7),
            INFLICTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.Sabotage),
        ),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If either unit or foe has an active【Bonus】 or【Penalty】effect,
        IF_NODE(OR_NODE(
                IS_BONUS_ACTIVE_ON_UNIT_NODE,
                IS_BONUS_ACTIVE_ON_FOE_NODE,
                IS_PENALTY_ACTIVE_ON_UNIT_NODE,
                IS_PENALTY_ACTIVE_ON_FOE_NODE),
            X_NUM_NODE(
                // grants bonus to unit's Atk/Res during combat = 20% of unit's Res at start of combat + 6.
                GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE(READ_NUM_NODE, 0, 0, READ_NUM_NODE),
                ADD_NODE(PERCENTAGE_NODE(20, UNITS_RES_AT_START_OF_COMBAT_NODE), 6),
            ),
        ),
    ));
}

// Arcane Fell Arts
{
    let skillId = Weapon.ArcaneFellArts;
    // Mt: 16 Rng:1
    // Accelerates Special trigger (cooldown count-1).
    // If foe's Range = 2,
    // calculates damage using the lower of foe's Def or Res.
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If foe initiates combat or if unit's HP ≥ 25% at start of combat,
        IF_NODE(OR_NODE(DOES_FOE_INITIATE_COMBAT_NODE, IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE),
            // grants bonus to unit's Atk/Spd/Def/Res = 25% of
            // foe's Atk at start of combat - 4 (max 14; min 5),
            GRANTS_ALL_STATS_PLUS_N_TO_TARGET_DURING_COMBAT_NODE(
                ENSURE_MAX_NODE(
                    PERCENTAGE_NODE(25, UNITS_ATK_AT_START_OF_COMBAT_NODE),
                    5, 14)
            ),
            // deals damage = 15% of unit's Atk
            // (including when dealing damage with an area-of-effect Special),
            DEALS_DAMAGE_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS(15, UNITS_ATK_DURING_COMBAT_NODE),
            // reduces damage from foe's attacks by 15% of unit's Atk
            // (including from area-of-effect Specials; excluding Rokkr area-of-effect Specials),
            REDUCES_DAMAGE_FROM_TARGETS_FOES_ATTACKS_BY_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS_NODE(
                15, UNITS_ATK_DURING_COMBAT_NODE),
            // grants Special cooldown charge +1 to unit per attack (only highest value applied; does not stack),
            GRANTS_SPECIAL_COOLDOWN_CHARGE_PLUS_1_TO_UNIT_PER_ATTACK_DURING_COMBAT_NODE,
            // and grants Special cooldown count-1 to unit before unit's first attack during combat.
            GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_N_TO_TARGET_BEFORE_TARGETS_FIRST_ATTACK_DURING_COMBAT_NODE(1),
        ),
    ));
    BEFORE_AOE_SPECIAL_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // deals damage = 15% of unit's Atk
        // (including when dealing damage with an area-of-effect Special),
        UNIT_DEALS_DAMAGE_BEFORE_COMBAT_NODE(PERCENTAGE_NODE(15, UNITS_ATK_AT_START_OF_COMBAT_NODE)),
        // reduces damage from foe's attacks by 15% of unit's Atk
        // (including from area-of-effect Specials; excluding Rokkr area-of-effect Specials),
        REDUCES_DAMAGE_BEFORE_COMBAT_NODE(PERCENTAGE_NODE(15, UNITS_ATK_AT_START_OF_COMBAT_NODE)),
    ));
}

// Protective
{
    let skillId = PassiveA.Protective;
    WHEN_INFLICTS_STATS_MINUS_TO_FOES_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // For foes within 3 rows or 3 columns centered on unit,
        IF_NODE(IS_TARGET_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_SKILL_OWNER_NODE,
            // inflicts Atk/Spd/Def/Res-5 on foe and
            INFLICTS_ALL_STATS_MINUS_N_ON_TARGET_DURING_COMBAT_NODE(5),
            // neutralizes foe's bonuses during combat.
            NEUTRALIZES_TARGETS_BONUSES_TO_STATS_DURING_COMBAT_NODE(true, true, true, true),
        ),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of combat,
        // if unit's HP ≥ 25%,
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE(
            // grants Atk/Spd/Def/Res+9 to unit and
            GRANTS_ALL_STATS_PLUS_N_TO_TARGET_DURING_COMBAT_NODE(9),
            // reduces the percentage of foe's non-Special "reduce damage by X%" skills by 50% during combat (excluding area-of-effect Specials),
            REDUCES_PERCENTAGE_OF_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE,
            // and also,
            // if foe is engaged or if unit's Res ≥ foe's Res+5,
            IF_NODE(OR_NODE(
                    IS_FOE_ENGAGED_NODE,
                    GTE_NODE(UNITS_EVAL_RES_DURING_COMBAT_NODE, ADD_NODE(FOES_EVAL_RES_DURING_COMBAT_NODE, 5))
                ),
                // reduces damage from foe's first attack by 15% of foe's Atk during combat
                // ("first attack" normally means only the first strike; for effects that grant "unit attacks twice." it means the first and second strikes),
                REDUCES_DAMAGE_FROM_FOES_FIRST_ATTACK_BY_PERCENTAGE_OF_TARGETS_STAT_DURING_COMBAT_INCLUDING_TWICE_NODE(
                    15, FOES_ATK_DURING_COMBAT_NODE),
                // and also,
                // if foe's attack can trigger foe's Special,
                IF_NODE(CAN_FOES_ATTACK_TRIGGER_FOES_SPECIAL_NODE,
                    // inflicts Special cooldown count+1 on foe before foe's first attack during combat (cannot exceed the foe's maximum Special cooldown).
                    INFLICTS_SPECIAL_COOLDOWN_COUNT_PLUS_N_ON_TARGETS_FOE_BEFORE_TARGETS_FOES_FIRST_ATTACK_NODE(1),
                ),
            ),
            // At start of combat,
            IF_NODE(AND_NODE(
                    // if unit's HP ≥ 25% and
                    IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE,
                    OR_NODE(
                        // if unit's support partner's HP ≤ 99% or
                        IS_THERE_TARGETS_ALLY_ON_MAP_NODE(AND_NODE(
                            ARE_TARGET_AND_SKILL_OWNER_PARTNERS_NODE,
                            IS_TARGETS_HP_LTE_99_PERCENT_IN_COMBAT_NODE),
                        ),
                        // if unit is within 2 spaces of an ally with HP ≤ 99%,
                        IS_THERE_TARGETS_ALLY_ON_MAP_NODE(AND_NODE(
                            IS_TARGET_WITHIN_2_SPACES_OF_SKILL_OWNER_NODE,
                            IS_TARGETS_HP_LTE_99_PERCENT_IN_COMBAT_NODE),
                        ),
                    ),
                ),
                // deals + 15 damage when Special triggers during combat (excluding area-of-effect Specials).
                DEALS_DAMAGE_WHEN_TRIGGERING_SPECIAL_DURING_COMBAT_PER_ATTACK_NODE(15),
            ),
        ),
    ));
}

// Edged Scales
{
    let skillId = PassiveB.EdgedScales;
    setAtStartOfCombatAndAfterStatsDeterminedHooks(skillId,
        // If foe initiates combat or if unit's HP ≥ 25% at start of combat,
        OR_NODE(DOES_FOE_INITIATE_COMBAT_NODE, IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE),
        SKILL_EFFECT_NODE(
            // inflicts Spd/Def/Res-4 on foe,
            INFLICTS_STATS_MINUS_ON_FOE_DURING_COMBAT_NODE(0, 4, 4, 4),
            // and increases the Spd difference necessary for foe to make a follow-up attack by 10 during combat,
            INCREASES_SPD_DIFF_NECESSARY_FOR_TARGETS_FOES_FOLLOW_UP_NODE(10),
        ),
        SKILL_EFFECT_NODE(
            // deals damage = 15% of foe's Atk (excluding area-of-effect Specials),
            DEALS_DAMAGE_X_NODE(PERCENTAGE_NODE(15, FOES_ATK_NODE)),
            // reduces damage from foe's first attack by 10
            // ("first attack" normally means only the first strike; for effects that grant "unit attacks twice," it means the first and second strikes),
            REDUCES_DAMAGE_FROM_FOES_FIRST_ATTACK_BY_N_DURING_COMBAT_INCLUDING_TWICE_NODE(10),
            // and also,
            // if unit's Spd > foe's Spd,
            IF_NODE(GT_NODE(UNITS_EVAL_SPD_DURING_COMBAT_NODE, FOES_EVAL_SPD_DURING_COMBAT_NODE),
                // neutralizes effects that guarantee foe's follow-up attacks and effects that prevent unit's follow-up attacks during combat.
                NULL_UNIT_FOLLOW_UP_NODE,
            ),
        ),
    );
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If foe initiates combat or if unit's HP ≥ 25% at start of combat,
        IF_NODE(OR_NODE(DOES_FOE_INITIATE_COMBAT_NODE, IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE),
        ),
    ));
}

// Fell Slaystone
{
    let skillId = Weapon.FellSlaystone;
    // Mt:16
    // Rng:1 Eff:
    // Accelerates Special trigger (cooldown count-1).
    // Effective against cavalry foes.
    // If foe's Range = 2,
    // calculates damage using the lower of foe's Def or Res.

    FOR_ALLIES_GRANTS_STATS_PLUS_TO_ALLIES_DURING_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // Grants Atk/Spd/Def/Res+4 to allies within 3 spaces of unit
        IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_SKILL_OWNER_NODE,
            GRANTS_ALL_STATS_PLUS_N_TO_TARGET_DURING_COMBAT_NODE(4),
        ),
        // Grants Atk/Spd/Def/Res+4 to engaged allies within 3 spaces of unit during their combat.
        IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_SKILL_OWNER_NODE,
            IF_NODE(IS_TARGET_ENGAGED_NODE,
                GRANTS_ALL_STATS_PLUS_N_TO_TARGET_DURING_COMBAT_NODE(4),
            ),
        ),
    ));
    FOR_ALLIES_GRANTS_STATS_PLUS_TO_ALLIES_DURING_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // and inflicts Special cooldown charge -1 on their foes per attack during combat (only highest value applied; does not stack).
        IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_SKILL_OWNER_NODE,
            INFLICTS_SPECIAL_COOLDOWN_CHARGE_MINUS_1_ON_FOE_NODE,
        ),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If foe initiates combat or foe's HP ≥ 75% at start of combat,
        IF_FOE_INITIATES_COMBAT_OR_IF_FOES_HP_GTE_75_PERCENT_AT_START_OF_COMBAT(
            // grants bonus to unit's Atk/Spd/Def/Res = number of allies within 3 spaces of unit × 3, + 5
            // (max 14; if unit triggers Savior, value is treated as 14),
            X_NUM_NODE(
                GRANTS_ALL_STATS_PLUS_N_TO_TARGET_DURING_COMBAT_NODE(READ_NUM_NODE),
                COND_OP(IS_TARGETS_SAVIOR_TRIGGERED_NODE,
                    14,
                    ENSURE_MAX_NODE(ADD_NODE(MULT_NODE(NUM_OF_TARGETS_ALLIES_WITHIN_3_SPACES_NODE, 3), 5), 14),
                ),
            ),
            // deals damage = 20% of unit's Def (excluding area-of-effect Specials),
            DEALS_DAMAGE_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS(20, UNITS_DEF_DURING_COMBAT_NODE),
            // reduces damage from foe's attacks by 20% of unit's Def (excluding area-of-effect Specials),
            REDUCES_DAMAGE_FROM_TARGETS_FOES_ATTACKS_BY_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS_NODE(
                20, UNITS_DEF_DURING_COMBAT_NODE
            ),
            // inflicts Special cooldown charge - 1 on foe per attack (only highest value applied; does not stack),
            INFLICTS_SPECIAL_COOLDOWN_CHARGE_MINUS_1_ON_FOE_NODE,
            // and grants Special cooldown count-1 to unit before foe's first attack during combat.
            GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_N_TO_TARGET_BEFORE_TARGETS_FOES_FIRST_ATTACK_DURING_COMBAT_NODE(1),
        ),
    ));
}

// Hidden Blade
{
    let skillId = Weapon.HiddenBlade;
    // Mt: 14
    // Rng: 2
    // Accelerates Special trigger (cooldown count-1).
    // Effect: (Dagger 7)
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of turn,
        // if unit's HP ≥ 25%,
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_TURN_NODE(
            // on closest foes and any foes within 2 spaces of those foes through their next actions.
            FOR_EACH_TARGETS_CLOSEST_FOE_AND_ANY_FOE_WITHIN_2_SPACES_OF_THOSE_FOES_NODE(
                // inflicts Spd/Def-7,
                INFLICTS_STATS_MINUS_ON_TARGET_ON_MAP_NODE(0, 7, 7, 0),
                // (Sabotage), and (Discord)
                INFLICTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.Sabotage, StatusEffectType.Discord),
            ),
        ),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of combat,
        // if unit's HP ≥ 25%,
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE(
            X_NUM_NODE(
                // grants bonus to unit's Atk/Spd = 20% of unit's Spd at start of combat + 6,
                GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE(READ_NUM_NODE, READ_NUM_NODE, 0, 0),
                ADD_NODE(PERCENTAGE_NODE(20, UNITS_SPD_AT_START_OF_COMBAT_NODE), 6),
            ),
            // deals damage = 20% of unit's Spd (excluding area-of-effect Specials),
            DEALS_DAMAGE_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS(20, UNITS_SPD_DURING_COMBAT_NODE),
            // grants Special cooldown charge +1 per attack (only highest value applied; does not stack),
            GRANTS_SPECIAL_COOLDOWN_CHARGE_PLUS_1_TO_UNIT_PER_ATTACK_DURING_COMBAT_NODE,
            // and grants Special cooldown count-1 before unit's first attack and
            GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_N_TO_TARGET_BEFORE_TARGETS_FIRST_ATTACK_DURING_COMBAT_NODE(1),
            // Special cooldown count-1 to unit before unit's first follow-up attack during combat.
            GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_N_TO_TARGET_BEFORE_TARGETS_FIRST_FOLLOW_UP_ATTACK_DURING_COMBAT_NODE(1),
        ),
    ));
}

// Trained to Kill
{
    let skillId = PassiveA.TrainedToKill;
    // Unit can move through foes' spaces.
    CAN_MOVE_THROUGH_FOES_SPACE_SKILL_SET.add(skillId);

    let filteredSpacesNode = FILTER_SPACES_NODE(SPACES_WITHIN_N_SPACES_OF_TARGET_NODE(2),
        OR_NODE(
            // - There is an ally.
            IS_THERE_SKILL_OWNERS_ALLY_ON_TARGET_SPACE_NODE,
            // - There is a Divine Vein effect applied.
            IS_THERE_DIVINE_VEIN_EFFECT_APPLIED_ON_TARGET_SPACES_NODE,
            // - It is defensive terrain.
            IS_TARGET_SPACE_DEFENSIVE_TERRAIN_NODE,
            // - It counts as difficult terrain, excluding impassable terrain.
            DOES_TARGET_SPACE_COUNT_AS_DIFFICULT_TERRAIN_EXCLUDING_IMPASSABLE_TERRAIN_NODE,
        ),
    );

    // If any space within 2 spaces of unit meets any of the following conditions,
    // unit can move to that space or any space within 2 spaces of that space,
    UNIT_CAN_MOVE_TO_A_SPACE_HOOKS.addSkill(skillId, () =>
        SPACES_WITHIN_N_SPACES_OF_SPACES_NODE(2, filteredSpacesNode),
    );

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If any space within 2 spaces of unit meets any of the following conditions,
        // if unit initiates combat,
        // unit attacks twice:
        IF_NODE(GT_NODE(COUNT_SPACES_NODE(filteredSpacesNode), 0),
            IF_NODE(DOES_UNIT_INITIATE_COMBAT_NODE,
                TARGET_ATTACKS_TWICE_WHEN_TARGET_INITIATES_COMBAT_NODE,
            ),
        ),

        // If unit initiates combat or is within 2 spaces of an ally,
        IF_UNIT_INITIATES_COMBAT_OR_IS_WITHIN_2_SPACES_OF_AN_ALLY(
            // grants Atk/Spd+10 to unit,
            GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE(10, 10, 0, 0),
            // neutralizes effects that guarantee foe's follow-up attacks and effects that prevent unit's follow-up attacks,
            NULL_UNIT_FOLLOW_UP_NODE,
            // and reduces the percentage of foe's non-Special "reduce damage by X%" skills by 50% during combat (excluding area-of-effect
            REDUCES_PERCENTAGE_OF_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE,
        ),
    ));
}

// Active Lookout
{
    let skillId = PassiveC.ActiveLookout;
    // Enables (Canto (2)) .
    enablesCantoN(skillId, 2);
    // When Canto triggers,
    WHEN_CANTO_TRIGGERS_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // enables unit to use (Distant Swap) on ally (this effect is not treated as an Assist skill; if similar effects are active,
        // this effect does not trigger).
        new EnablesTargetToUseCantoAssistOnTargetsAllyNode(AssistType.Move, CantoSupport.Swap, 2),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit initiates combat or is within 2 spaces of an ally,
        IF_UNIT_INITIATES_COMBAT_OR_IS_WITHIN_2_SPACES_OF_AN_ALLY(
            // grants Atk/Spd+4 to unit during combat.
            GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE(4, 4, 0, 0),
        ),
        // If unit initiates combat,
        IF_NODE(DOES_UNIT_INITIATE_COMBAT_NODE,
            // unit can make a follow-up attack
            UNIT_CAN_MAKE_FOLLOW_UP_ATTACK_BEFORE_FOES_NEXT_ATTACK_NODE,
        ),
    ));
}

{
    let skillId = PassiveB.Chivalry2;
    // Enables【Canto (Rem. +1; Min ２)】.
    enablesCantoRemPlusMin(skillId, 1, 2);
    // Reduces damage from attacks during combat and from area-of-effect Specials by 50% (excluding Røkkr area-of-effect Specials).
    BEFORE_AOE_SPECIAL_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        REDUCES_DAMAGE_FROM_AOE_SPECIALS_BY_X_PERCENT_NODE(50),
    ));

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // Reduces damage from attacks during combat and from area-of-effect Specials by 50% (excluding Røkkr area-of-effect Specials).
        REDUCES_DAMAGE_FROM_TARGETS_FOES_ATTACKS_BY_X_PERCENT_DURING_COMBAT_NODE(50),
        // Inflicts Atk/Spd/Def-5 on foe,
        INFLICTS_STATS_MINUS_ON_FOE_DURING_COMBAT_NODE(5, 5, 5, 0),
        // deals damage = X% of unit's Atk (excluding area-of-effect Specials),
        APPLY_SKILL_EFFECTS_AFTER_STATUS_FIXED_NODE(
            // reduces damage from foe's attacks by X% of unit's Atk (excluding area-of-effect Specials; if foe's HP ≥ 50% at start of combat,
            // X = 25; otherwise,
            // X = 15),
            REDUCES_DAMAGE_FROM_TARGETS_FOES_ATTACKS_BY_X_DURING_COMBAT_NODE(
                PERCENTAGE_NODE(
                    COND_OP(GTE_NODE(FOES_HP_PERCENTAGE_AT_START_OF_COMBAT_NODE, 50), 25, 15),
                    UNITS_ATK_DURING_COMBAT_NODE,
                ),
            ),
        ),
        X_NUM_NODE(
            // and grants Special cooldown count-Y to unit before unit's first attack during combat
            GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_N_TO_TARGET_BEFORE_TARGETS_FIRST_ATTACK_DURING_COMBAT_NODE(READ_NUM_NODE),
            // (Y = number of spaces from start position to end position of whoever initiated combat,
            // max 3; if foe's HP ≥ 75% at start of combat, however, value is treated as 3).
            COND_OP(GTE_NODE(FOES_HP_PERCENTAGE_AT_START_OF_COMBAT_NODE, 75),
                3,
                NUMBER_OF_SPACES_FROM_START_POSITION_TO_END_POSITION_OF_WHOEVER_INITIATED_COMBAT,
            ),
        ),
    ));
}

{
    let skillId = getNormalSkillId(Weapon.EbonBolverk);
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        IF_NODE(GTE_NODE(NUM_OF_TARGETS_ALLIES_WITHIN_2_SPACES_NODE, 2),
            GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(
                StatusEffectType.NullFollowUp,
                StatusEffectType.SpecialCooldownChargePlusOnePerAttack),
        ),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        IF_UNIT_INITIATES_COMBAT_OR_IS_WITHIN_2_SPACES_OF_AN_ALLY(
            GRANTS_ALL_STATS_PLUS_5_TO_TARGET_DURING_COMBAT_NODE,
            RESTORES_7_HP_TO_UNIT_AFTER_COMBAT_NODE,
        ),
    ));
}
{
    let skillId = getRefinementSkillId(Weapon.EbonBolverk);
    // Accelerates Special trigger (cooldown count-1).
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of turn,
        // if unit is within 2 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_2_SPACES_OF_TARGETS_ALLY_NODE,
            // to unit and allies within 2 spaces of unit for 1 turn.
            FOR_EACH_TARGET_AND_TARGETS_ALLY_WITHIN_2_SPACES_OF_TARGET_NODE(
                // grants Atk/Spd+6,
                GRANTS_STATS_PLUS_TO_TARGET_ON_MAP_NODE(6, 6, 0, 0),
                // [Null Follow-Up)
                // o and
                // "Special cooldown charge +1 per attack during combat (only highest value applied; does not stack)"
                GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(
                    StatusEffectType.NullFollowUp,
                    StatusEffectType.SpecialCooldownChargePlusOnePerAttack,
                )
            ),
        ),

        // At start of turn,
        // if the number of allies within 2 spaces of unit ≥ 2,
        IF_NODE(IS_TARGET_WITHIN_2_SPACES_OF_TARGETS_ALLY_NODE,
            // grants "unit can move 1 extra space" to unit (that turn only; does not stack).
            GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.MobilityIncreased),
        ),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit initiates combat or is within 2 spaces of an ally,
        IF_UNIT_INITIATES_COMBAT_OR_IS_WITHIN_2_SPACES_OF_AN_ALLY(
            // grants Atk/Spd/Def/Res+5 to unit
            GRANTS_ALL_STATS_PLUS_5_TO_TARGET_DURING_COMBAT_NODE,
            // and deals +X x 5 damage during combat
            // (X = number of (Bonus) effects active on unit and foe,
            // excluding stat bonuses; max 5; excluding area-of-effect Specials),
            UNIT_DEALS_DAMAGE_EXCLUDING_AOE_SPECIALS_NODE(
                MULT_NODE(
                    ENSURE_MAX_NODE(NUM_OF_BONUS_ON_UNIT_PLUS_NUM_OF_PENALTY_ON_FOE_EXCLUDING_STAT_NODE, 5),
                    5
                )
            ),
            // and restores 7 HP to unit after combat.
            RESTORES_7_HP_TO_UNIT_AFTER_COMBAT_NODE,
        ),
    ));
}
{
    let skillId = getSpecialRefinementSkillId(Weapon.EbonBolverk);
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of combat,
        // if unit's HP ≥ 25%,
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE(
            X_NUM_NODE(
                // grants bonus to unit's Atk/Spd/Def/Res = number of
                GRANTS_ALL_STATS_PLUS_N_TO_TARGET_DURING_COMBAT_NODE(READ_NUM_NODE),
                // foes within 3 rows or 3 columns centered on unit x 2, + 5 (max 11),
                ENSURE_MAX_NODE(
                    ADD_NODE(MULT_NODE(NUM_OF_FOES_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_UNIT_NODE, 2), 5),
                    11
                )
            ),
            // neutralizes unit's penalties to Atk/Spd,
            new NeutralizesPenaltiesToUnitsStatsNode(true, true, false, false),
            // reduces damage from foe's first attack by 7
            // ("first attack" normally means only the first strike; for effects that grant "unit attacks twice," it means the first and second strikes),
            REDUCES_DAMAGE_FROM_FOES_FIRST_ATTACK_BY_N_DURING_COMBAT_INCLUDING_TWICE_NODE(7),
            // and reduces the percentage of foe's non-Special "reduce damage by X%" skills by 50% during combat (excluding area-of-effect Specials).
            REDUCES_PERCENTAGE_OF_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE,
        ),
    ));
}

{
    let skillId = Weapon.AerialLongsword;
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of turn,
        // if unit is within 2 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_2_SPACES_OF_TARGETS_ALLY_NODE,
            // to unit and allies within 2 spaces for 1 turn.
            FOR_EACH_TARGET_AND_TARGETS_ALLY_WITHIN_2_SPACES_OF_TARGET_NODE(
                // grants Atk/Spd+6,
                GRANTS_STATS_PLUS_TO_TARGET_ON_MAP_NODE(6, 6, 0, 0),
                // [Null Follow-Uplo and "neutralizes penalties on unit during combat"
                GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(
                    StatusEffectType.NullFollowUp,
                    StatusEffectType.NeutralizesPenalties),
            ),
        ),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit initiates combat or is within 2 spaces of an ally,
        IF_UNIT_INITIATES_COMBAT_OR_IS_WITHIN_2_SPACES_OF_AN_ALLY(
            // grants bonus to Atk/Spd/Def/Res = 5 + 10% of unit's Spd at start of combat,
            GRANTS_ALL_STATS_PLUS_N_TO_UNIT_DURING_COMBAT_NODE(
                ADD_NODE(5, PERCENTAGE_NODE(10, UNITS_SPD_AT_START_OF_COMBAT_NODE)),
            ),
            // reduces damage from foe's first attack by 7
            // ("first attack" normally means only the first strike; for effects that grant "unit attacks twice," it means the first and second strikes),
            REDUCES_DAMAGE_FROM_FOES_FIRST_ATTACK_BY_N_DURING_COMBAT_INCLUDING_TWICE_NODE(7),
            // and grants Special cooldown charge +1 to unit per attack during combat (only highest value applied; does not stack).
            GRANTS_SPECIAL_COOLDOWN_CHARGE_PLUS_1_TO_UNIT_PER_ATTACK_DURING_COMBAT_NODE,
        ),
    ));
}
{
    let skillId = getSpecialRefinementSkillId(Weapon.AerialLongsword);
    // Enables Canto (2) •
    enablesCantoN(skillId, 2);
    // Unit can move to a space within 2 spaces of any ally within 2 spaces.
    setSkillThatUnitCanMoveToAnySpaceWithinNSpacesOfAnAllyWithinMSpacesOfUnit(skillId, 2, 2);
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of combat,
        // if unit's HP ≥ 25%,
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE(
            // grants Atk/Spd/Def/Res+5 to unit and
            GRANTS_ALL_STATS_PLUS_5_TO_TARGET_DURING_COMBAT_NODE,
            // deals damage = 20% of unit's Spd during combat
            // (excluding area-of-effect Specials).
            DEALS_DAMAGE_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS(20, UNITS_SPD_DURING_COMBAT_NODE),
        ),
    ));
}

{
    let skillId = getNormalSkillId(Weapon.Grafcalibur);
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        IF_UNIT_INITIATES_COMBAT_OR_IS_WITHIN_2_SPACES_OF_AN_ALLY(
            GRANTS_ALL_STATS_PLUS_5_TO_TARGET_DURING_COMBAT_NODE,
            NEUTRALIZES_FOES_BONUSES_TO_STATS_DURING_COMBAT_NODE,
        ),
    ));
}
{
    let skillId = getRefinementSkillId(Weapon.Grafcalibur);
    // Accelerates Special trigger (cooldown count-1).
    // Effective against flying foes.
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit initiates combat or if unit is within 2 spaces of an ally,
        IF_UNIT_INITIATES_COMBAT_OR_IS_WITHIN_2_SPACES_OF_AN_ALLY(
            // grants Atk/Spd/Def/Res+5,
            GRANTS_ALL_STATS_PLUS_5_TO_TARGET_DURING_COMBAT_NODE,
            // neutralizes foe's bonuses (from skills like Fortify, Rally, etc.),
            NEUTRALIZES_FOES_BONUSES_TO_STATS_DURING_COMBAT_NODE,
            // and deals damage = 20%
            // of unit's Spd during combat (excluding area-of effect Specials).
            DEALS_DAMAGE_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS(20, UNITS_SPD_DURING_COMBAT_NODE),
        ),
    ));
}
{
    let skillId = getSpecialRefinementSkillId(Weapon.Grafcalibur);
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of turn,
        // if unit's HP ≥ 25%,
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_TURN_NODE(
            // on closest foes and foes within 2 spaces of those foes through their next actions.
            FOR_EACH_TARGETS_CLOSEST_FOE_AND_ANY_FOE_WITHIN_2_SPACES_OF_THOSE_FOES_NODE(
                // inflicts Spd/Res-7 and [Sabotage)
                INFLICTS_STATS_MINUS_ON_TARGET_ON_MAP_NODE(0, 7, 0, 7),
                INFLICTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.Sabotage),
            ),
        ),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of combat,
        // if unit's HP ≥ 25%,
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE(
            // grants bonus to unit's Atk/Spd/Def/Res = 10% of
            // unit's Spd at start of combat + 5 and
            GRANTS_ALL_STATS_PLUS_N_TO_UNIT_DURING_COMBAT_NODE(
                ADD_NODE(PERCENTAGE_NODE(10, UNITS_SPD_AT_START_OF_COMBAT_NODE), 5),
            ),
            // grants Special cooldown count-2 to unit before unit's first follow-up attack during combat.
            GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_N_TO_TARGET_BEFORE_TARGETS_FIRST_FOLLOW_UP_ATTACK_DURING_COMBAT_NODE(2),
        ),
    ));
}

{
    let skillId = Weapon.DarkMonograph;
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode());
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If foe initiates combat or foe's HP ≥ 75% at start of combat,
        IF_FOE_INITIATES_COMBAT_OR_IF_FOES_HP_GTE_75_PERCENT_AT_START_OF_COMBAT(
            // inflicts Atk/Spd/Res-5 on foe,
            INFLICTS_ALL_STATS_MINUS_5_ON_FOE_DURING_COMBAT_NODE,
            // deals damage = 20% of unit's Res
            // (excluding area-of-effect Specials),
            DEALS_DAMAGE_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS(20, UNITS_RES_DURING_COMBAT_NODE),
            // and grants Special cooldown charge +1 to unit per attack during combat (only highest value applied; does not stack),
            GRANTS_SPECIAL_COOLDOWN_CHARGE_PLUS_1_TO_UNIT_PER_ATTACK_DURING_COMBAT_NODE,
            // and restores 7 HP to unit after combat.
            RESTORES_7_HP_TO_UNIT_AFTER_COMBAT_NODE,
        ),
    ));
}
{
    let skillId = getSpecialRefinementSkillId(Weapon.DarkMonograph);
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of turn,
        // if unit's HP ≥ 25%,
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_TURN_NODE(
            // on closest foes and foes within 2 spaces of those foes through their next actions.
            FOR_EACH_TARGETS_CLOSEST_FOE_AND_ANY_FOE_WITHIN_2_SPACES_OF_THOSE_FOES_NODE(
                // inflicts Atk/Res-7,
                INFLICTS_STATS_MINUS_ON_TARGET_ON_MAP_NODE(7, 0, 0, 7),
                // (Panic) , and Deep Wounds)
                INFLICTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.Panic, StatusEffectType.DeepWounds),
            ),
        ),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of combat,
        // if unit's HP ≥ 25%,
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE(
            // inflicts Atk/Spd/Res-5 on foe,
            INFLICTS_ALL_STATS_MINUS_5_ON_FOE_DURING_COMBAT_NODE,
            // neutralizes unit's penalties to Atk/Spd/Res,
            new NeutralizesPenaltiesToUnitsStatsNode(true, true, false, true),
            // and unit makes guaranteed follow-up attack during combat.
            UNIT_MAKES_GUARANTEED_FOLLOW_UP_ATTACK_NODE,
        ),
    ));
}

{
    let skillId = getNormalSkillId(Weapon.BowOfFrelia);
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE(
            GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE(6, 6, 0, 0),
            DEALS_DAMAGE_WHEN_TRIGGERING_SPECIAL_DURING_COMBAT_PER_ATTACK_NODE(7),
            WHEN_SPECIAL_TRIGGERS_NEUTRALIZES_FOES_REDUCES_DAMAGE_BY_PERCENTAGE_EFFECTS_FROM_FOES_NON_SPECIAL_EXCLUDING_AOE_SPECIALS_NODE,
        ),
    ));
}
{
    let skillId = getRefinementSkillId(Weapon.BowOfFrelia);
    // Bow of Frelia
    // Mt 14 Rng 2 Eff E
    // Accelerates Special trigger (cooldown count-1).
    // Effective against flying foes.
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of combat,
        // if unit's HP ≥ 25%,
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE(
            // grants Atk/Spd+6 and Def/Res+5 to unit during combat,
            GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE(6, 6, 0, 0),
            GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE(0, 0, 5, 5),
            // and also,
            // if Special triggers (excluding area-of-effect Specials),
            // deals +15 damage and
            DEALS_DAMAGE_WHEN_TRIGGERING_SPECIAL_DURING_COMBAT_PER_ATTACK_NODE(15),
            // neutralizes "reduces damage by X%" effects from foe's non-Special skills.
            WHEN_SPECIAL_TRIGGERS_NEUTRALIZES_FOES_REDUCES_DAMAGE_BY_PERCENTAGE_EFFECTS_FROM_FOES_NON_SPECIAL_EXCLUDING_AOE_SPECIALS_NODE,
        ),
    ));
}
{
    let skillId = getSpecialRefinementSkillId(Weapon.BowOfFrelia);
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of turn,
        // grants Special cooldown count-1.
        GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_ON_TARGET_ON_MAP_NODE(1),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit initiates combat or is within 2 spaces of an ally,
        IF_UNIT_INITIATES_COMBAT_OR_IS_WITHIN_2_SPACES_OF_AN_ALLY(
            // grants Atk/Spd/Def/Res+5 to unit,
            GRANTS_ALL_STATS_PLUS_5_TO_TARGET_DURING_COMBAT_NODE,
            // neutralizes effects that inflict "Special cooldown charge -X" on unit and
            NEUTRALIZES_EFFECTS_THAT_INFLICT_SPECIAL_COOLDOWN_CHARGE_MINUS_X_ON_UNIT,
            // disables skills of all foes excluding foe in combat during combat.
            UNIT_DISABLES_SKILLS_OF_ALL_OTHERS_IN_COMBAT_EXCLUDING_UNIT_AND_FOE_NODE,
        ),
    ));
}

{
    let skillId = PassiveC.OpeningRetainerPlus;
    // Allies within 2 spaces can move to any space within 2 spaces of unit.
    setSkillThatAlliesWithinNSpacesOfUnitCanMoveToAnySpaceWithinMSpacesOfUnit(skillId, 2, 2);

    FOR_ALLIES_GRANTS_STATS_PLUS_TO_ALLIES_DURING_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // For allies within 3 spaces of unit,
        IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_SKILL_OWNER_NODE,
            // grants Atk/Spd/Def/Res+5 and
            GRANTS_ALL_STATS_PLUS_5_TO_TARGET_DURING_COMBAT_NODE,
        ),
    ));

    FOR_ALLIES_GRANTS_STATS_PLUS_TO_ALLIES_DURING_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // For allies within 3 spaces of unit,
        IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_SKILL_OWNER_NODE,
            // neutralizes foe's bonuses during combat,
            NEUTRALIZES_FOES_BONUSES_TO_STATS_DURING_COMBAT_NODE,
            // and also,
            // when ally deals damage to foe during their combat,
            // restores 7 HP to that ally.
            WHEN_TARGET_DEALS_DAMAGE_DURING_COMBAT_RESTORES_N_HP_TO_TARGET_NODE(7),
        ),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit is within 3 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_TARGETS_ALLY_NODE,
            // grants Atk/Spd/Def/Res+5 to unit,
            GRANTS_ALL_STATS_PLUS_5_TO_TARGET_DURING_COMBAT_NODE,
            // neutralizes foe's bonuses,
            NEUTRALIZES_FOES_BONUSES_TO_STATS_DURING_COMBAT_NODE,
            // and reduces the percentage of foe's non-Special "reduce damage by X%" skills by 50% during combat (excluding area-of-effect Specials),
            REDUCES_PERCENTAGE_OF_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE,
            // and also,
            // when unit deals damage to foe during combat,
            // restores 7 HP to unit.
            WHEN_TARGET_DEALS_DAMAGE_DURING_COMBAT_RESTORES_N_HP_TO_TARGET_NODE(7),
        ),
    ));
}

// Horn of Opening
{
    let skillId = getNormalSkillId(Weapon.HornOfOpening);
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode());
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        X_NUM_NODE(
            IF_NODE(GTE_NODE(READ_NUM_NODE, 1),
                GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE(6, 0, 0, 0),
                INFLICTS_STATS_MINUS_ON_FOE_DURING_COMBAT_NODE(6, 0, 0, 0),
            ),
            IF_NODE(GTE_NODE(READ_NUM_NODE, 2),
                UNIT_MAKES_GUARANTEED_FOLLOW_UP_ATTACK_NODE,
            ),
            IF_NODE(GTE_NODE(READ_NUM_NODE, 3),
                FOE_CANNOT_MAKE_FOLLOW_UP_ATTACK_NODE,
            ),
            NUM_OF_TARGETS_ALLIES_WITHIN_3_SPACES_NODE,
        ),
    ));
}
{
    let skillId = getRefinementSkillId(Weapon.HornOfOpening);
    // Mt 14 Rng 1 HP+3
    // Accelerates Special trigger (cooldown count-1).
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode());
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit is within 3 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_TARGETS_ALLY_NODE,
            // grants Atk+6 and Spd+5 to unit,
            GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE(6, 0, 0, 0),
            GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE(0, 5, 0, 0),
            // inflicts Atk-6 on foe,
            INFLICTS_STATS_MINUS_ON_FOE_DURING_COMBAT_NODE(6, 0, 0, 0),
            // unit makes a guaranteed follow-up attack,
            UNIT_MAKES_GUARANTEED_FOLLOW_UP_ATTACK_NODE,
            // foe cannot make a follow-up attack,
            FOE_CANNOT_MAKE_FOLLOW_UP_ATTACK_NODE,
            APPLY_SKILL_EFFECTS_AFTER_STATUS_FIXED_NODE(
                // and reduces damage from foe's attacks by X% of unit's Def during combat
                // (X = number of allies within 3 spaces of unit x 10; max 30; excluding area-of-effect Specials),
                REDUCES_DAMAGE_FROM_TARGETS_FOES_ATTACKS_BY_X_DURING_COMBAT_NODE(
                    PERCENTAGE_NODE(
                        ENSURE_MAX_NODE(MULT_NODE(NUM_OF_TARGETS_ALLIES_WITHIN_3_SPACES_NODE, 10), 30),
                        UNITS_DEF_DURING_COMBAT_NODE,
                    ),
                ),
                // and also,
                // when foe's attack triggers foe's Special,
                // reduces damage further by X% of unit's Def (excluding area-of-effect Specials).
                REDUCES_DAMAGE_WHEN_FOES_SPECIAL_EXCLUDING_AOE_SPECIAL_NODE(
                    PERCENTAGE_NODE(
                        ENSURE_MAX_NODE(MULT_NODE(NUM_OF_TARGETS_ALLIES_WITHIN_3_SPACES_NODE, 10), 30),
                        UNITS_DEF_DURING_COMBAT_NODE,
                    ),
                ),
            ),
        ),
    ));
    // At start of turn,
    // if unit is adjacent to only beast or dragon allies or if unit is not adjacent to any ally,
    // unit transforms (otherwise,
    // unit reverts).
    // If unit transforms,
    // grants Atk+2,
    // deals +7 damage when Special triggers,
    // and neutralizes effects that grant "Special cooldown charge +X" to foe or inflict "Special cooldown charge -X" on unit.
    setBeastSkill(skillId, BeastCommonSkillType.Infantry2);
}
{
    let skillId = getSpecialRefinementSkillId(Weapon.HornOfOpening);
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If foe initiates combat or foe's HP ≥ 75% at start of combat,
        IF_FOE_INITIATES_COMBAT_OR_IF_FOES_HP_GTE_75_PERCENT_AT_START_OF_COMBAT(
            // grants bonus to unit's
            // Atk/Spd/Def/Res = number of allies within 3 spaces of unit x 2, + 5 (max 11),
            GRANTS_ALL_STATS_PLUS_N_TO_TARGET_DURING_COMBAT_NODE(
                ENSURE_MAX_NODE(ADD_NODE(MULT_NODE(NUM_OF_TARGETS_ALLIES_WITHIN_3_SPACES_NODE, 2), 5), 11),
            ),
            // deals damage = 20% of unit's Def
            // (excluding area-of-effect Specials),
            DEALS_DAMAGE_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS(20, UNITS_DEF_DURING_COMBAT_NODE),
            // and grants Special cooldown count-1 to unit before unit's first attack during combat.
            GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_N_TO_TARGET_BEFORE_TARGETS_FIRST_ATTACK_DURING_COMBAT_NODE(1),
        ),
    ));
}

// Frostfire Breath
{
    let skillId = getNormalSkillId(Weapon.FrostfireBreath);
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        IF_NODE(IS_BONUS_ACTIVE_ON_TARGET_NODE,
            GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE(6, 6, 0, 0),
            X_NUM_NODE(
                GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE(READ_NUM_NODE, 0, 0, 0),
                MULT_TRUNC_NODE(ADD_NODE(TARGET_DEF_BONUS_NODE, TARGET_RES_BONUS_NODE), 1.5),
            ),
        ),
    ));
}
{
    let skillId = getRefinementSkillId(Weapon.FrostfireBreath);
    // Mt 16 Rng 1 Eff
    // G
    // HP +3
    // Effective against dragon foes. Grants Atk+3.
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If (Bonus) is active on unit,
        IF_NODE(IS_BONUS_ACTIVE_ON_TARGET_NODE,
            // grants Atk/Spd+6 and Def/Res+5 to unit and grants
            GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE(6, 6, 0, 0),
            GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE(0, 0, 5, 5),
            X_NUM_NODE(
                // bonus to unit's Atk/Spd = highest total
                GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE(READ_NUM_NODE, READ_NUM_NODE, 0, 0),
                // bonuses to Def/Res among unit and allies within 3 spaces of unit x 2,
                MULT_NODE(
                    HIGHEST_TOTAL_BONUSES_TO_AMONG_UNIT_AND_ALLIES_WITHIN_N_SPACES_NODE(3,
                        ADD_NODE(TARGET_DEF_BONUS_NODE, TARGET_RES_BONUS_NODE)),
                    2
                ),
            ),
            // reduces damage from foe's first attack by 7
            // ("first attack" normally means only the first strike; for effects that grant "unit attacks twice," it means the first and second strikes),
            REDUCES_DAMAGE_FROM_FOES_FIRST_ATTACK_BY_N_DURING_COMBAT_INCLUDING_TWICE_NODE(7),
            // and neutralizes effects that guarantee foe's follow-up attacks and effects that prevent unit's follow-up attacks during combat,
            NULL_UNIT_FOLLOW_UP_NODE,
            // and restores 7 HP to unit after combat.
            RESTORES_7_HP_TO_UNIT_AFTER_COMBAT_NODE,
            // If foe's Range = 2,
            // calculates damage using
            // the lower of foe's Def or Res.
        ),
    ));
}
{
    let skillId = getSpecialRefinementSkillId(Weapon.FrostfireBreath);
    // Enables [Canto (2)) •
    enablesCantoN(skillId, 2);
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of turn,
        // if unit is within 2 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_2_SPACES_OF_TARGETS_ALLY_NODE,
            // to unit and allies within 2 spaces of unit for 1 turn.
            FOR_EACH_TARGET_AND_TARGETS_ALLY_WITHIN_2_SPACES_OF_TARGET_NODE(
                // grants Def/Res+6,
                GRANTS_STATS_PLUS_TO_TARGET_ON_MAP_NODE(0, 0, 6, 6),
                // [Bonus Doubler, and [Null Panic)
                GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.BonusDoubler, StatusEffectType.NullPanic),
            ),
        ),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit initiates combat or is within 2 spaces of an ally,
        IF_UNIT_INITIATES_COMBAT_OR_IS_WITHIN_2_SPACES_OF_AN_ALLY(
            // grants Atk/Spd/Def/Res+5 to unit and
            GRANTS_ALL_STATS_PLUS_5_TO_UNIT_DURING_COMBAT_NODE,
            // reduces the percentage of foe's non-Special "reduce damage by X%" skills by 50% during combat (excluding area-of-effect Specials).
            REDUCES_PERCENTAGE_OF_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE,
        ),
    ));
}

{
    let skillId = Weapon.EaglesHeart;
    // Eagle's Heart
    // Mt: 16
    // Rng: 1
    // Enables /Canto (Rem. +1; Min 2)) .
    enablesCantoRemPlusMin(skillId, 1, 2);
    // Accelerates Special trigger (cooldown count-1).

    grantsAnotherActionAfterCanto(skillId);

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit initiates combat or the number of allies adjacent to unit ≤ 1,
        IF_NODE(OR_NODE(DOES_UNIT_INITIATE_COMBAT_NODE, LTE_NODE(NUM_OF_TARGETS_ALLIES_WITHIN_1_SPACES_NODE, 1)),
            X_NUM_NODE(
                // inflicts penalty on foe's Atk/Def = 20% of unit's Def at start of combat + 6,
                INFLICTS_STATS_MINUS_ON_FOE_DURING_COMBAT_NODE(READ_NUM_NODE, 0, READ_NUM_NODE, 0),
                ADD_NODE(PERCENTAGE_NODE(20, UNITS_DEF_AT_START_OF_COMBAT_NODE), 6),
            ),
            X_NUM_NODE(
                // unit deals +X x 5 damage
                UNIT_DEALS_DAMAGE_EXCLUDING_AOE_SPECIALS_NODE(MULT_NODE(READ_NUM_NODE, 5)),
                // and reduces damage from foe's attacks by X x 3 during combat (excluding area-of-effect Specials),
                REDUCES_DAMAGE_FROM_TARGETS_FOES_ATTACKS_BY_X_DURING_COMBAT_NODE(MULT_NODE(READ_NUM_NODE, 3)),
                // and also,
                // reduces damage by an additional X × 3 when foe's attack triggers foe's Special (excluding area-of-effect Specials),
                REDUCES_DAMAGE_WHEN_FOES_SPECIAL_EXCLUDING_AOE_SPECIAL_NODE(MULT_NODE(READ_NUM_NODE, 3)),
                // (X = number of Bonus effects active on unit,
                // excluding stat bonuses + number of Penalty effects active on foe,
                // excluding stat penalties; max 5; excluding area-of-effect Specials),
                ENSURE_MAX_NODE(NUM_OF_BONUS_ON_UNIT_PLUS_NUM_OF_PENALTY_ON_FOE_EXCLUDING_STAT_NODE, 5),
            ),
            // grants Special cooldown count-1 to unit before unit's first attack during combat,
            GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_N_TO_TARGET_BEFORE_TARGETS_FIRST_ATTACK_DURING_COMBAT_NODE(1),
            // and restores 7 HP to unit after combat.
            RESTORES_7_HP_TO_UNIT_AFTER_COMBAT_NODE,
        ),
    ));
}

// Pure Storm
{
    let skillId = PassiveB.PureStorm;
    // At start of turn and after unit acts (if Canto triggers, after Canto),
    let nodeFunc = () => SKILL_EFFECT_NODE(
        // on closest foes and foes within 2 spaces of those foes through their next actions.
        FOR_EACH_TARGETS_CLOSEST_FOE_AND_ANY_FOE_WITHIN_2_SPACES_OF_THOSE_FOES_NODE(
            // inflicts Atk/Def-7,
            INFLICTS_STATS_MINUS_ON_TARGET_ON_MAP_NODE(7, 0, 7, 0),
            // (Exposure), and (Sabotage)
            INFLICTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.Exposure, StatusEffectType.Sabotage),
        ),
    );
    AT_START_OF_TURN_HOOKS.addSkill(skillId, nodeFunc);
    AFTER_UNIT_ACTS_IF_CANTO_TRIGGERS_AFTER_CANTO_HOOKS.addSkill(skillId, nodeFunc);

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If target has entered combat aside from this combat on the current turn and unit initiates combat,
        IF_NODE(AND_NODE(HAS_FOE_ENTERED_COMBAT_DURING_CURRENT_TURN_NODE, DOES_UNIT_INITIATE_COMBAT_NODE),
            // target cannot trigger their Special during combat.
            FOE_CANNOT_TRIGGER_SPECIALS_DURING_COMBAT_NODE,
        ),
        // If unit initiates combat or the number of allies adjacent to unit ≤ 1,
        IF_NODE(OR_NODE(DOES_UNIT_INITIATE_COMBAT_NODE, LTE_NODE(NUM_OF_TARGETS_ALLIES_WITHIN_1_SPACES_NODE, 1)),
            // inflicts Atk/Def-5 on foe,
            INFLICTS_STATS_MINUS_ON_FOE_DURING_COMBAT_NODE(5, 0, 5, 0),
            // deals damage = 20% of unit's Def (excluding area-of-effect Specials),
            DEALS_DAMAGE_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS(20, UNITS_DEF_DURING_COMBAT_NODE),
            // and reduces the percentage of foe's non-Special "reduces damage by X%" skills by 50% during combat (excluding area-of-effect Specials).
            REDUCES_PERCENTAGE_OF_TARGETS_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE,
        ),
    ));
    AFTER_COMBAT_FOR_ANOTHER_ACTION_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // If unit initiates combat and number of allies adjacent to unit ≤ 1 after combat,
        IF_NODE(OR_NODE(DOES_TARGET_INITIATE_COMBAT_NODE, LTE_NODE(NUM_OF_TARGETS_ALLIES_WITHIN_1_SPACES_NODE, 1)),
            // grants another action to unit
            GRANTS_ANOTHER_ACTION_NODE,
            // (once per turn; if a skill effect moves unit after combat,
            // this effect occurs based on unit's final placement after that movement).
        ),
    ));
}

// Assault Rush
{
    let skillId = PassiveC.AssaultRush;
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of turn,
        // if unit's HP = 100% or any foe is within 3 columns or 3 rows centered on unit,
        IF_NODE(OR_NODE(
                IS_UNITS_HP_GTE_100_PERCENT_AT_START_OF_TURN_NODE,
                EXISTS_UNITS(TARGETS_FOES_ON_MAP_NODE,
                    IS_TARGET_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_SKILL_OWNER_NODE),
            ),
            // grants Atk+6,
            GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE(6, 0, 0, 0),
            // "unit can move 1 extra space (that turn only, does not stack)," and
            GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.MobilityIncreased),
            // [Chargel to unit for 1 turn.
            GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.Charge),
        ),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit initiates combat,
        IF_NODE(DOES_UNIT_INITIATE_COMBAT_NODE,
            // grants Atk+5 to unit and
            GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE(5, 0, 0, 0),
            // grants Special cooldown count-1 to unit before unit's first attack during combat.
            GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_N_TO_TARGET_BEFORE_TARGETS_FIRST_ATTACK_DURING_COMBAT_NODE(1),
        ),
    ));
}

// Lion's Heart
{
    let skillId = Weapon.LionsHeart;
    // Mt: 16
    // Rng: 1
    // Enables [Canto (Rem. +1; Min 2)) •
    enablesCantoRemPlusMin(skillId, 1, 2);
    // Accelerates Special trigger (cooldown count-1).

    // After Canto,
    // if unit entered combat on the current turn,
    // grants another action to unit,
    // and re-enables Canto (once per turn; does not trigger when affected by effects of traps in Aether Raids during Canto).
    grantsAnotherActionAfterCanto(skillId);

    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of turn,
        // if unit is within 2 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_2_SPACES_OF_TARGETS_ALLY_NODE,
            // grants "unit can move 1 extra space" to unit (that turn only; does not stack),
            GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.MobilityIncreased),
            // and grants the following statuses
            // on unit and allies within 2 spaces of unit for 1 turn:
            FOR_EACH_TARGET_AND_TARGETS_ALLY_WITHIN_2_SPACES_OF_TARGET_NODE(
                // "neutralizes penalties on unit during combat" and
                // "Special cooldown charge +1 to unit per attack during combat (only highest value applied; does not stack)."
                GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(
                    StatusEffectType.NeutralizesPenalties,
                    StatusEffectType.SpecialCooldownChargePlusOnePerAttack),
            ),
        ),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit initiates combat or is within 2 spaces of an ally,
        IF_UNIT_INITIATES_COMBAT_OR_IS_WITHIN_2_SPACES_OF_AN_ALLY(
            // grants bonus to unit's Atk/Spd/Def/Res = 15% of unit's
            // Spd at start of combat + 5,
            GRANTS_ALL_STATS_PLUS_N_TO_UNIT_DURING_COMBAT_NODE(
                ADD_NODE(PERCENTAGE_NODE(15, UNITS_SPD_AT_START_OF_COMBAT_NODE), 5),
            ),
            X_NUM_NODE(
                // unit deals +X x 5 damage
                UNIT_DEALS_DAMAGE_EXCLUDING_AOE_SPECIALS_NODE(MULT_NODE(READ_NUM_NODE, 5)),
                // and reduces damage from foe's first attack by X x 3 during combat
                // ("first attack" normally means only the first strike; for effects that grant "unit attacks twice," it means the first and second strikes),
                REDUCES_DAMAGE_FROM_FOES_FIRST_ATTACK_BY_N_DURING_COMBAT_INCLUDING_TWICE_NODE(MULT_NODE(READ_NUM_NODE, 3)),
                // and also,
                // reduces damage by an additional X x 3 when foe's attack triggers foe's Special (excluding area-of-effect Specials),
                REDUCES_DAMAGE_WHEN_FOES_SPECIAL_EXCLUDING_AOE_SPECIAL_NODE(MULT_NODE(READ_NUM_NODE, 3)),

                // (X = number of Bonus effects active on unit, excluding stat bonuses + number of Penalty effects active on foe,
                // excluding stat penalties; max 5; excluding area-of-effect Specials),
                ENSURE_MAX_NODE(NUM_OF_BONUS_ON_UNIT_PLUS_NUM_OF_PENALTY_ON_FOE_EXCLUDING_STAT_NODE, 5),
            ),
            // and restores 7 HP to unit after combat.
            RESTORES_7_HP_TO_UNIT_AFTER_COMBAT_NODE,
        ),
    ));
}

// Haze Slice
{
    let skillId = Special.HazeSlice;
    setSpecialCount(skillId, 3);
    NORMAL_ATTACK_SPECIAL_SET.add(skillId);

    // 3
    WHEN_APPLIES_SPECIAL_EFFECTS_AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // Boosts damage by 35% of unit's Atk when Special triggers.
        BOOSTS_DAMAGE_WHEN_SPECIAL_TRIGGERS_NODE(PERCENTAGE_NODE(35, UNITS_ATK_DURING_COMBAT_NODE)),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit initiates combat,
        IF_NODE(DOES_UNIT_INITIATE_COMBAT_NODE,
            // grants Special cooldown count-1 to unit before unit's first attack and
            GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_N_TO_TARGET_BEFORE_TARGETS_FIRST_ATTACK_DURING_COMBAT_NODE(1),
            // reduces damage from foe's attacks by 40% during combat
            // (excluding area-of-effect Specials).
            REDUCES_DAMAGE_FROM_TARGETS_FOES_ATTACKS_BY_X_PERCENT_BY_SPECIAL_NODE(40),
        ),
    ));
}

// Pure Atrocity
{
    let skillId = PassiveB.PureAtrocity;
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode());
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit initiates combat or is within 2 spaces of an ally,
        IF_UNIT_INITIATES_COMBAT_OR_IS_WITHIN_2_SPACES_OF_AN_ALLY(
            // inflicts Spd/Def-5 on foe,
            INFLICTS_STATS_MINUS_ON_FOE_DURING_COMBAT_NODE(0, 5, 5, 0),
            // deals damage = 25% of unit's Atk (excluding area-of-effect Specials),
            DEALS_DAMAGE_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS(25, UNITS_ATK_DURING_COMBAT_NODE),
            // grants Special cooldown count-1 to unit before unit's first attack,
            GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_N_TO_TARGET_BEFORE_TARGETS_FIRST_ATTACK_DURING_COMBAT_NODE(1),
            // neutralizes effects that guarantee foe's follow-up attacks and effects that prevent unit's follow-up attacks,
            NULL_UNIT_FOLLOW_UP_NODE,
            // and reduces the percentage of foe's non-Special
            // "reduce damage by X%" skills by 50% during combat (excluding area-of-effect Specials).
            REDUCES_PERCENTAGE_OF_TARGETS_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE,
        ),
    ));

    AFTER_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // After combat,
        // if unit attacked,
        IF_NODE(DOES_UNIT_INITIATE_COMBAT_NODE,
            // on target and any foe within 2 spaces of target,
            FOR_EACH_FOE_AND_FOES_ALLY_WITHIN_N_SPACES_OF_TARGET_NODE(2, TRUE_NODE,
                // neutralizes two (Bonus) effects
                // excluding stat bonuses (does not apply to (Bonus) effects that are applied at the same time; neutralizes the first applicable (Bonus) effects on foe's list of active effects),
                NEUTRALIZES_TARGETS_N_BONUS_EFFECTS_NODE(2),
            ),
            // and applies (Divine Vein (Haze)] on target's space and on each space within 2 spaces of target's space for 1 turn.
            FOR_EACH_SPACES_NODE(SPACES_WITHIN_N_SPACES_OF_FOE_NODE(2),
                APPLY_DIVINE_VEIN_NODE(DivineVeinType.Haze, TARGET_GROUP_NODE, 1),
            ),
        ),
    ));
}

// Deer's Heart
{
    let skillId = Weapon.DeersHeart;
    // Mt: 14
    // Rng:2
    // Eff:
    // Enables /Canto (Rem.; Min 1)) .
    enablesCantoRemPlusMin(skillId, 0, 1);
    // Accelerates Special trigger (cooldown count-1).
    // Effective against flying foes.

    // Re After Canto (including cases where action is ended due to Canto Control),
    // if unit entered combat on the current turn,
    // grants another action to unit,
    // and re-enables Canto (once per turn; does not trigger when affected by effects of traps in Aether Raids during Canto).
    grantsAnotherActionAfterCanto(skillId);

    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of turn,
        // if unit is within 2 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_2_SPACES_OF_TARGETS_ALLY_NODE,
            // to unit and allies within 2 spaces of unit for 1 turn.
            FOR_EACH_TARGET_AND_TARGETS_ALLY_WITHIN_2_SPACES_OF_TARGET_NODE(
                // grants [Null Follow-Up) and (Preempt Pulse)
                GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.NullFollowUp, StatusEffectType.PreemptPulse),
            ),
        ),
    ));

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit initiates combat or is within 2 spaces of an ally,
        IF_UNIT_INITIATES_COMBAT_OR_IS_WITHIN_2_SPACES_OF_AN_ALLY(
            // grants bonus to unit's Atk/Spd/Def/Res = 15% of unit's
            // Spd at start of combat + 5,
            GRANTS_ALL_STATS_PLUS_N_TO_UNIT_DURING_COMBAT_NODE(
                ADD_NODE(PERCENTAGE_NODE(15, UNITS_SPD_AT_START_OF_COMBAT_NODE), 5),
            ),
            // neutralizes foe's bonuses to Spd/Def,
            new NeutralizesFoesBonusesToStatsDuringCombatNode(false, true, true, false),
            X_NUM_NODE(
                // deals +X x 5 damage
                UNIT_DEALS_DAMAGE_EXCLUDING_AOE_SPECIALS_NODE(MULT_NODE(READ_NUM_NODE, 5)),
                // (X = number of Bonus effects active on unit,
                // excluding stat bonuses + number of Penalty effects active on foe,
                // excluding stat penalties; max 5; excluding area-of-effect Specials),
                ENSURE_MAX_NODE(NUM_OF_BONUS_ON_UNIT_PLUS_NUM_OF_PENALTY_ON_FOE_EXCLUDING_STAT_NODE, 5),
            ),
            // and neutralizes effects that inflict "Special cooldown charge
            // -X" on unit during combat,
            NEUTRALIZES_EFFECTS_THAT_INFLICT_SPECIAL_COOLDOWN_CHARGE_MINUS_X_ON_UNIT,
            // and restores 7 HP to unit after combat.
            RESTORES_7_HP_TO_UNIT_AFTER_COMBAT_NODE,
        ),
    ));
}

// Pure Starfall
{
    let skillId = PassiveB.PureStarfall;
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit initiates combat or if [Deep Star) is active on unit,
        IF_NODE(OR_NODE(DOES_UNIT_INITIATE_COMBAT_NODE, HAS_TARGET_STATUS_EFFECT_NODE(StatusEffectType.DeepStar)),
            // inflicts Spd/Def-5 on foe,
            INFLICTS_STATS_MINUS_ON_FOE_DURING_COMBAT_NODE(0, 5, 5, 0),
            APPLY_SKILL_EFFECTS_AFTER_STATUS_FIXED_NODE(
                // unit deals +X damage (X = 20% of unit's Spd; excluding area-of-effect Specials),
                UNIT_DEALS_DAMAGE_EXCLUDING_AOE_SPECIALS_NODE(
                    PERCENTAGE_NODE(20, UNITS_SPD_DURING_COMBAT_NODE)),
                // reduces damage from foe's first attack by X ("first attack" normally means only the first strike; for effects that grant "unit attacks twice," it means the first and second strikes),
                REDUCES_DAMAGE_FROM_FOES_FIRST_ATTACK_BY_N_DURING_COMBAT_INCLUDING_TWICE_NODE(
                    PERCENTAGE_NODE(20, UNITS_SPD_DURING_COMBAT_NODE)),
            ),
            // and reduces the percentage of foe's non-Special "reduce damage by X%" skills by 50% during combat (excluding area-of-effect Specials),
            REDUCES_PERCENTAGE_OF_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE,
            // and also,
            // if foe's attack can trigger foe's Special,
            IF_NODE(CAN_FOES_ATTACK_TRIGGER_FOES_SPECIAL_NODE,
                // inflicts Special cooldown count+ 1 on foe before foe's first attack (cannot exceed the foe's maximum Special cooldown).
                INFLICTS_SPECIAL_COOLDOWN_COUNT_PLUS_N_ON_TARGETS_FOE_BEFORE_TARGETS_FOES_FIRST_ATTACK_NODE(1),
            ),
        ),
        // If unit initiates combat,
        IF_NODE(DOES_UNIT_INITIATE_COMBAT_NODE,
            // reduces damage from foe's first attack by 80% during combat
            // ("first attack" normally means only the first strike; for effects that grant "unit attacks twice," it means the first and second strikes).
            REDUCES_DAMAGE_FROM_FOES_FIRST_ATTACK_BY_N_PERCENT_DURING_COMBAT_INCLUDING_TWICE_NODE(80),
        ),
    ));

    AFTER_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit initiates combat,
        IF_NODE(DOES_UNIT_INITIATE_COMBAT_NODE,
            // grants (Deep Star) and [Vantage) to unit and
            GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.DeepStar, StatusEffectType.Vantage),
            // on target and foes within 1 space of target after combat.
            FOR_EACH_FOE_AND_FOES_ALLY_WITHIN_N_SPACES_OF_TARGET_NODE(1, TRUE_NODE,
                // inflicts [Gravity)
                INFLICTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.Gravity),
            ),
        ),
    ));
}

// Incite Hone
{
    let setSkill = (skillId, statsFlags) => {
        AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
            // At start of turn,
            // if unit is within 2 spaces of an ally,
            IF_NODE(IS_TARGET_WITHIN_2_SPACES_OF_TARGETS_ALLY_NODE,
                // to unit and allies within 2 spaces of unit for 1 turn.
                FOR_EACH_TARGET_AND_TARGETS_ALLY_WITHIN_2_SPACES_OF_TARGET_NODE(
                    // grants Atk/Spd+6 and (Incited)
                    GRANTS_STATS_PLUS_AT_START_OF_TURN_NODE(...statsFlags.map(f => f ? 6 : 0)),
                    GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.Incited),
                ),
            ),
        ));
        AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
            X_NUM_NODE(
                // Grants bonus to unit's Atk/Spd during combat = number
                GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE(...statsFlags.map(f => f ? READ_NUM_NODE : 0)),
                // of allies on the map with the (Incited) effect + 2 (excluding unit; max 5).
                ENSURE_MAX_NODE(
                    ADD_NODE(
                        COUNT_IF_UNITS_NODE(TARGETS_ALLIES_ON_MAP_NODE,
                            HAS_TARGET_STATUS_EFFECT_NODE(StatusEffectType.Incited)),
                        2
                    ),
                    5
                )
            )
        ));
    };
    setSkill(PassiveC.ASInciteHone, [true, true, false, false]);
    setSkill(PassiveC.ARInciteHone, [true, false, false, true]);
}

{
    let skillId = Weapon.DevotedBreath;
    // Devoted Breath
    // Mt: 16
    // Rng: 1
    // Accelerates Special trigger (cooldown count-1).
    // If foe's Range = 2, calculates damage using the lower of foe's Def or Res.
    FOR_ALLIES_GRANTS_STATS_PLUS_TO_ALLIES_DURING_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // For allies within 3 spaces of unit,
        IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_SKILL_OWNER_NODE,
            // grants Def/Res+5 and
            GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE(0, 0, 5, 5),
        ),
    ));
    FOR_ALLIES_GRANTS_EFFECTS_TO_ALLIES_DURING_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // For allies within 3 spaces of unit,
        IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_SKILL_OWNER_NODE,
            // reduces damage from foe's first attack by 7 during combat
            // ("first attack" normally means only the first strike; for effects that grant "unit attacks twice,
            // " it means the first and second strikes).
            REDUCES_DAMAGE_FROM_FOES_FIRST_ATTACK_BY_N_DURING_COMBAT_INCLUDING_TWICE_NODE(7),
        ),
        // For allies within 3 spaces of unit,
        IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_SKILL_OWNER_NODE,
            // if foe initiates combat, ally's HP > 1,
            IF_NODE(NOT_NODE(DOES_TARGET_INITIATE_COMBAT_NODE),
                // and foe would reduce ally's HP to 0 during combat, ally survives with 1 HP
                // (once per turn; does not stack with non-Special effects that allow unit to survive with 1 HP if foe's attack would reduce unit's HP to 0; when any other such effect triggers,
                // this effect will trigger too).
                TARGET_CAN_ACTIVATE_NON_SPECIAL_MIRACLE_ONCE_PER_TURN_NODE,
            ),
        ),
    ));

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // Neutralizes "effective against dragons" bonuses.
        TARGET_NEUTRALIZES_EFFECTIVE_AGAINST_X_NODE(EffectiveType.Dragon),
        // If foe initiates combat or foe's HP ≥ 75% at start of combat,
        IF_FOE_INITIATES_COMBAT_OR_IF_FOES_HP_GTE_75_PERCENT_AT_START_OF_COMBAT(
            X_NUM_NODE(
                // grants bonus to unit's Atk/Def/Res =
                GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE(READ_NUM_NODE, 0, READ_NUM_NODE, READ_NUM_NODE),
                // 20% of unit's Res at start of combat + 5,
                ADD_NODE(PERCENTAGE_NODE(20, UNITS_RES_AT_START_OF_COMBAT_NODE), 5),
            ),
            X_NUM_NODE(
                // unit deals +X damage
                UNIT_DEALS_DAMAGE_EXCLUDING_AOE_SPECIALS_NODE(READ_NUM_NODE),
                // reduces damage from foe's attacks by X (excluding area-of-effect Specials),
                REDUCES_DAMAGE_FROM_TARGETS_FOES_ATTACKS_BY_X_DURING_COMBAT_NODE(READ_NUM_NODE),
                // (X = number of allies within 3 spaces of unit × 5; max 15; if unit triggers Savior,
                // value is treated as 15; excluding area-of-effect Specials),
                COND_OP(IS_TARGETS_SAVIOR_TRIGGERED_NODE,
                    15,
                    ENSURE_MAX_NODE(MULT_NODE(NUM_OF_TARGETS_ALLIES_WITHIN_3_SPACES_NODE, 5), 15)
                ),
            ),
            // unit makes a guaranteed follow-up attack,
            UNIT_MAKES_GUARANTEED_FOLLOW_UP_ATTACK_NODE,
            // and reduces the percentage of foe's non-Special "reduce damage by X%" skills by 50% during combat (excluding area-of-effect Specials),
            REDUCES_PERCENTAGE_OF_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE,
            // and also,
            // if unit's HP > 1 and foe would reduce unit's HP to 0,
            // unit survives with 1 HP (once per combat; does not stack with non-Special effects that allow unit to survive with 1 HP if foe's attack would reduce HP to 0).
            TARGET_CAN_ACTIVATE_NON_SPECIAL_MIRACLE_NODE(0),
        ),
    ));
}

{
    let skillId = PassiveB.PureDragonWall;
    // Pure Dragon Wall
    // If a skill compares unit's Res to a foe's or ally's Res,
    // treats unit's Res as if granted +5.
    AT_COMPARING_STATS_HOOKS.addSkill(skillId, () => STATS_NODE(0, 0, 0, 5));

    BEFORE_AOE_SPECIAL_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit's Res > foe's Res,
        IF_NODE(UNITS_RES_GT_FOES_RES_AT_START_OF_COMBAT_NODE,
            // reduces damage from attacks during combat and from area-of-effect Specials
            REDUCES_DAMAGE_FROM_AOE_SPECIALS_BY_X_PERCENT_NODE(
                COND_OP(
                    // (excluding Rokkr area-of-effect Specials) by the following percentage:
                    // if it is unit's first combat initiated by unit or first combat initiated by foe in player phase or enemy phase,
                    IS_IT_TARGETS_FIRST_COMBAT_INITIATED_BY_TARGET_OR_FIRST_COMBAT_INITIATED_BY_TARGETS_FOE_IN_PLAYER_PHASE_OR_ENEMY_PHASE_NODE,
                    // percentage = difference between stats × 6 (max 60%); otherwise,
                    // percentage = difference between stats × 4 (max 40%).
                    ENSURE_MAX_NODE(MULT_NODE(DIFFERENCE_BETWEEN_RES_STATS_AT_START_OF_COMBAT_NODE, 6), 60),
                    ENSURE_MAX_NODE(MULT_NODE(DIFFERENCE_BETWEEN_RES_STATS_AT_START_OF_COMBAT_NODE, 4), 40),
                ),
            ),
        ),
        X_NUM_NODE(
            // deals damage = X% of unit's Res
            UNIT_DEALS_DAMAGE_BEFORE_COMBAT_NODE(PERCENTAGE_NODE(READ_NUM_NODE, UNITS_RES_AT_START_OF_COMBAT_NODE)),
            // reduces damage from foe's attacks by X% of unit's Res (including from area-of-effect Specials; excluding Rokkr area-of-effect Specials),
            REDUCES_DAMAGE_BEFORE_COMBAT_NODE(PERCENTAGE_NODE(READ_NUM_NODE, UNITS_RES_AT_START_OF_COMBAT_NODE)),
            // (if it is unit's first combat initiated by unit or first combat
            // initiated by foe in player phase or enemy phase, X = 30; otherwise, X = 20;
            // including from area-of-effect Specials; excluding Rokkr area-of-effect Specials),
            COND_OP(
                IS_IT_TARGETS_FIRST_COMBAT_INITIATED_BY_TARGET_OR_FIRST_COMBAT_INITIATED_BY_TARGETS_FOE_IN_PLAYER_PHASE_OR_ENEMY_PHASE_NODE,
                30, 20
            )
        ),
    ));

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit's Res > foe's Res,
        APPLY_SKILL_EFFECTS_AFTER_STATUS_FIXED_NODE(
            IF_NODE(UNITS_RES_GT_FOES_RES_DURING_COMBAT_NODE,
                // reduces damage from attacks during combat and from area-of-effect Specials
                // (excluding Rokkr area-of-effect Specials) by the following percentage:
                REDUCES_DAMAGE_FROM_TARGETS_FOES_ATTACKS_BY_X_PERCENT_DURING_COMBAT_NODE(
                    COND_OP(
                        // if it is unit's first combat initiated by unit or first combat initiated by foe in player phase or enemy phase,
                        IS_IT_TARGETS_FIRST_COMBAT_INITIATED_BY_TARGET_OR_FIRST_COMBAT_INITIATED_BY_TARGETS_FOE_IN_PLAYER_PHASE_OR_ENEMY_PHASE_NODE,
                        // percentage = difference between stats × 6 (max 60%); otherwise,
                        // percentage = difference between stats × 4 (max 40%).
                        ENSURE_MAX_NODE(MULT_NODE(DIFFERENCE_BETWEEN_RES_STATS_NODE, 6), 60),
                        ENSURE_MAX_NODE(MULT_NODE(DIFFERENCE_BETWEEN_RES_STATS_NODE, 4), 40),
                    ),
                ),
            ),
        ),
        // Inflicts Atk/Def/Res-5 on foe,
        INFLICTS_STATS_MINUS_ON_FOE_DURING_COMBAT_NODE(5, 0, 5, 5),
        APPLY_SKILL_EFFECTS_AFTER_STATUS_FIXED_NODE(
            IF_ELSE_NODE(
                IS_IT_TARGETS_FIRST_COMBAT_INITIATED_BY_TARGET_OR_FIRST_COMBAT_INITIATED_BY_TARGETS_FOE_IN_PLAYER_PHASE_OR_ENEMY_PHASE_NODE,
                SKILL_EFFECT_NODE(
                    // deals damage = X% of unit's Res
                    UNIT_DEALS_DAMAGE_EXCLUDING_AOE_SPECIALS_NODE(PERCENTAGE_NODE(30, UNITS_RES_DURING_COMBAT_NODE)),
                    // reduces damage from foe's attacks by X% of unit's Res (including from area-of-effect Specials; excluding Rokkr area-of-effect Specials),
                    REDUCES_DAMAGE_EXCLUDING_AOE_SPECIALS_NODE(PERCENTAGE_NODE(30, UNITS_RES_DURING_COMBAT_NODE)),
                ),
                SKILL_EFFECT_NODE(
                    // deals damage = X% of unit's Res
                    UNIT_DEALS_DAMAGE_EXCLUDING_AOE_SPECIALS_NODE(PERCENTAGE_NODE(20, UNITS_RES_DURING_COMBAT_NODE)),
                    // reduces damage from foe's attacks by X% of unit's Res (including from area-of-effect Specials; excluding Rokkr area-of-effect Specials),
                    REDUCES_DAMAGE_EXCLUDING_AOE_SPECIALS_NODE(PERCENTAGE_NODE(20, UNITS_RES_DURING_COMBAT_NODE)),
                ),
            ),
        ),
        // and neutralizes effects that inflict "Special cooldown charge -X" on unit during combat,
        NEUTRALIZES_EFFECTS_THAT_INFLICT_SPECIAL_COOLDOWN_CHARGE_MINUS_X_ON_UNIT,
        // and also,
        APPLY_SKILL_EFFECTS_AFTER_STATUS_FIXED_NODE(
            // if foe's attack can trigger foe's Special and unit's Res ≥ foe's Res+5,
            IF_NODE(
                AND_NODE(
                    CAN_FOES_ATTACK_TRIGGER_FOES_SPECIAL_NODE,
                    GTE_NODE(UNITS_RES_DURING_COMBAT_NODE, ADD_NODE(FOES_RES_DURING_COMBAT_NODE, 5))
                ),
            ),
        ),
    ));
    // At start of turn and after combat,
    let nodeFunc = () => new SkillEffectNode(
        // if dragon or beast ally is on player team or if unit is within 2 spaces of an ally,
        IF_NODE(OR_NODE(
                GT_NODE(COUNT_IF_UNITS_NODE(TARGETS_ALLIES_ON_MAP_NODE, IS_TARGET_BEAST_OR_DRAGON_TYPE_NODE), 0),
                IS_TARGET_WITHIN_2_SPACES_OF_TARGETS_ALLY_NODE),
            // restores 10 HP to unit.
            RESTORE_TARGET_HP_NODE(10),
        ),
    );
    AT_START_OF_TURN_HOOKS.addSkill(skillId, nodeFunc);
    AFTER_COMBAT_HOOKS.addSkill(skillId, nodeFunc);
}

{
    let skillId = PassiveC.LowerGround;
    // C Lower Ground

    // If foe with Range = 1 initiates combat against an ally within 2
    // spaces of unit,
    // triggers (Savior) on unit.
    setSaveSkill(skillId, true);
    // Foes with Range = 1 cannot warp into spaces within 3 spaces of unit and
    // foes with Range = 2 cannot warp into spaces
    // within 4 spaces of unit (in either case, does not affect foes with Pass skills or warp effects from structures,
    // like camps and fortresses in Rival Domains).
    UNIT_CANNOT_WARP_INTO_SPACES_HOOKS.addSkill(skillId, () =>
        OR_NODE(
            AND_NODE(new IsTargetMeleeWeaponNode(), IS_SPACE_WITHIN_3_SPACES_OF_SKILL_OWNER_NODE),
            AND_NODE(new IsTargetRangedWeaponNode(), IS_SPACE_WITHIN_4_SPACES_OF_SKILL_OWNER_NODE),
        ),
    );

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If foe's Range = 1,
        IF_NODE(EQ_NODE(TARGETS_RANGE_NODE, 1),
            // grants Def/Res+4 to unit during combat.
            GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE(0, 0, 4, 4),
        ),
    ));
}

// Duo Skill
{
    let skillId = Hero.DuoRhea;
    WHEN_TRIGGERS_DUO_OR_HARMONIZED_EFFECT_HOOKS_MAP.addValue(skillId,
        new SkillEffectNode(
            // Grants the following status to unit and allies within 2 spaces of unit for 1 turn:
            FOR_EACH_TARGET_AND_TARGETS_ALLY_WITHIN_2_SPACES_OF_TARGET_NODE(
                // "neutralizes foe's bonuses during combat."
                GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.NeutralizesFoesBonusesDuringCombat),
            ),
            // Applies (Divine Vein (Stone)) to unit's space and spaces within 2 spaces of unit for 2 turns.
            FOR_EACH_SPACES_NODE(SPACES_WITHIN_N_SPACES_OF_TARGET_NODE(2),
                APPLY_DIVINE_VEIN_NODE(DivineVeinType.Stone, TARGET_GROUP_NODE, 2),
            ),
        ),
    );
}

{
    let skillId = Weapon.Spear;
    // Grants Atk+3. Unit can counterattack regardless of foe's range.
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of turn,
        // if unit's HP ≥ 25%,
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_TURN_NODE(
            // grants the following effects to unit and allies within 2 spaces of unit for 1 turn
            FOR_EACH_TARGET_AND_TARGETS_ALLY_WITHIN_2_SPACES_OF_TARGET_NODE(
                // : Atk/Def+6,
                GRANTS_STATS_PLUS_TO_TARGET_ON_MAP_NODE(6, 0, 6, 0),
                // "neutralizes 'effective against flying' bonuses," and "neutralizes foe's bonuses during combat."
                GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(
                    StatusEffectType.ShieldFlying,
                    StatusEffectType.NeutralizesFoesBonusesDuringCombat),
            ),
        ),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of combat,
        // if unit's HP ≥ 25%,
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE(
            // grants bonus to unit's Atk/Spd/Def/Res =
            GRANTS_ALL_STATS_PLUS_N_TO_UNIT_DURING_COMBAT_NODE(
                // number of foes within 3 rows or 3 columns centered on unit × 3, + 5 (max 14),
                ENSURE_MAX_NODE(
                    ADD_NODE(MULT_NODE(NUM_OF_FOES_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_UNIT_NODE, 3), 5),
                    14
                ),
            ),
            // deals damage = 10% of unit's Atk (excluding area-of-effect Specials),
            DEALS_DAMAGE_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS(10, UNITS_ATK_DURING_COMBAT_NODE),
            // and reduces damage from foe's attacks by 10% of unit's Atk during combat (excluding area-of-effect Specials).
            REDUCES_DAMAGE_FROM_TARGETS_FOES_ATTACKS_BY_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS_NODE(
                10, UNITS_ATK_DURING_COMBAT_NODE),
        ),
    ));
}

{
    let skillId = Weapon.BlessedAureola;
    // Blessed Aureola
    // Mt: 14
    // Rng: 2
    // Accelerates Special trigger (cooldown count-1).
    // Effective against magic foes.
    FOR_ALLIES_GRANTS_STATS_PLUS_TO_ALLIES_DURING_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // For allies within 3 rows or 3 columns centered on unit,
        IF_NODE(IS_TARGET_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_SKILL_OWNER_NODE,
            // grants Atk/Def/Res+5 during combat,
            GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE(5, 0, 5, 5),
        ),
    ));
    FOR_ALLIES_GRANTS_EFFECTS_TO_ALLIES_AFTER_OTHER_SKILLS_DURING_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // and also,
        IF_NODE(IS_TARGET_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_SKILL_OWNER_NODE,
            // if ally's attack can trigger ally's Special,
            IF_NODE(CAN_TARGETS_ATTACK_TRIGGER_TARGETS_SPECIAL_NODE,
                // grants Special cooldown count-1 to ally before their first attack during combat,
                GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_N_TO_TARGET_BEFORE_TARGETS_FIRST_ATTACK_DURING_COMBAT_NODE(1),
                // and also,
                // if ally cannot perform a follow-up attack and attack twice,
                IF_NODE(AND_NODE(
                        NOT_NODE(CAN_TARGET_MAKE_FOLLOW_UP_INCLUDING_POTENT_NODE),
                        NOT_NODE(IF_TARGET_TRIGGERS_ATTACKS_TWICE_NODE)),
                    // grants Special cooldown count-1 to ally before their first attack during combat.
                    GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_N_TO_TARGET_BEFORE_TARGETS_FIRST_ATTACK_DURING_COMBAT_NODE(1),
                ),
            ),
        ),
    ));

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If there is an ally within 3 rows or 3 columns centered on unit,
        IF_NODE(IS_THERE_ALLY_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_UNIT_NODE,
            X_NUM_NODE(
                // grants bonus to unit's Atk/Def/Res =
                GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE(READ_NUM_NODE, 0, READ_NUM_NODE, READ_NUM_NODE),
                // 20% of unit's
                // Res at start of combat + 5,
                ADD_NODE(PERCENTAGE_NODE(20, UNITS_RES_AT_START_OF_COMBAT_NODE), 5),
            ),
            // deals damage = 20% of unit's Res (excluding area-of-effect Specials),
            DEALS_DAMAGE_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS(20, UNITS_RES_DURING_COMBAT_NODE),
            // reduces damage from foe's attacks by 20% of unit's Res (excluding area-of-effect Specials),
            REDUCES_DAMAGE_FROM_TARGETS_FOES_ATTACKS_BY_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS_NODE(
                20, UNITS_RES_DURING_COMBAT_NODE),
            // and grants Special cooldown count-1 to unit before unit's first attack during combat.
            GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_N_TO_TARGET_BEFORE_TARGETS_FIRST_ATTACK_DURING_COMBAT_NODE(1),
        ),
        // If there is an ally within 3 rows or 3 columns centered on unit and foe uses magic,
        IF_NODE(AND_NODE(IS_THERE_ALLY_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_UNIT_NODE, DOES_FOE_USE_MAGIC_NODE),
            // grants Atk+10 to unit during combat,
            GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE(10, 0, 0, 0),
            // and also,
            // if foe initiates combat,
            IF_NODE(DOES_FOE_INITIATE_COMBAT_NODE,
                // unit can counterattack before foe's first attack.
                TARGET_CAN_COUNTERATTACK_BEFORE_TARGETS_FOES_FIRST_ATTACK_NODE
            ),
        ),
    ));
}

{
    let skillId = Special.FrostMoon;
    // Frost Moon
    NORMAL_ATTACK_SPECIAL_SET.add(skillId);
    setSpecialCount(skillId, 4);

    // When Special triggers,
    WHEN_APPLIES_SPECIAL_EFFECTS_AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // boosts damage by 70% of unit's Res and neutralizes foe's "reduces damage by X%" effects from foe's non-Special skills.
        BOOSTS_DAMAGE_WHEN_SPECIAL_TRIGGERS_NODE(
            PERCENTAGE_NODE(75, UNITS_RES_DURING_COMBAT_NODE),
        ),
        WHEN_SPECIAL_TRIGGERS_NEUTRALIZES_FOES_REDUCES_DAMAGE_BY_PERCENTAGE_EFFECTS_FROM_FOES_NON_SPECIAL_EXCLUDING_AOE_SPECIALS_NODE,
    ));
    AFTER_FOLLOW_UP_CONFIGURED_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit cannot perform a follow-up attack and attack twice,
        IF_NODE(AND_NODE(
                NOT_NODE(CAN_TARGET_MAKE_FOLLOW_UP_INCLUDING_POTENT_NODE),
                NOT_NODE(IF_TARGET_TRIGGERS_ATTACKS_TWICE_NODE)),
            // grants Special cooldown count-1 to unit before unit's first attack during combat.
            GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_N_TO_TARGET_BEFORE_TARGETS_FIRST_ATTACK_DURING_COMBAT_NODE(1),
        ),
    ));
}

{
    let skillId = PassiveA.BeyondReason;
    // Beyond Reason
    // Grants Atk/Def/Res+ 10.
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If foe initiates combat or foe's HP ≥ 75% at start of combat,
        IF_FOE_INITIATES_COMBAT_OR_IF_FOES_HP_GTE_75_PERCENT_AT_START_OF_COMBAT(
            X_NUM_NODE(
                // grants bonus to unit's Atk/Def/Res = A + B
                GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE(READ_NUM_NODE, 0, READ_NUM_NODE, READ_NUM_NODE),
                // (A = 2 x number of Penalty) effects active on foe and foes within 3 rows or 3 columns centered on that foe,
                // excluding stat penalties; max 12;
                ENSURE_MAX_NODE(
                    MULT_NODE(
                        2,
                        NUM_OF_PENALTY_ON_FOE_AND_FOES_WITHIN_N_ROWS_OR_N_COLUMNS_CENTERED_ON_THAT_FOE_EXCLUDING_STAT_NODE(3),
                    ),
                    12)
            ),

            // B = 2 x current penalty
            // on unit's respective stats; calculates each stat penalty independently),
            FOR_EACH_TARGET_STAT_INDEX_NODE([STATUS_INDEX.Atk, STATUS_INDEX.Def, STATUS_INDEX.Res],
                GRANTS_STAT_PLUS_TO_TARGET_DURING_COMBAT_NODE(
                    MULT_NODE(2, GET_STAT_AT_NODE(TARGETS_PENALTIES_NODE, READ_NUM_NODE)),
                    READ_NUM_NODE
                ),
            ),
            // neutralizes foe's bonuses to Atk/Res,
            new NeutralizesFoesBonusesToStatsDuringCombatNode(true, false, false, true),
            // and
            // restores 7 HP to unit after combat.
            RESTORES_7_HP_TO_UNIT_AFTER_COMBAT_NODE,
        ),
    ));
    AFTER_FOLLOW_UP_CONFIGURED_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        IF_FOE_INITIATES_COMBAT_OR_IF_FOES_HP_GTE_75_PERCENT_AT_START_OF_COMBAT(
            // and reduces damage from foe's first attack by X% during combat
            // ("first attack" normally means only the first strike; for effects that grant "unit attacks twice," it means the first and second strikes;
            // if foe can make a follow-up attack, X = 80; otherwise, X = 40),
            REDUCES_DAMAGE_FROM_FOES_FIRST_ATTACK_BY_N_PERCENT_DURING_COMBAT_INCLUDING_TWICE_NODE(
                COND_OP(CAN_TARGETS_FOE_MAKE_FOLLOW_UP_INCLUDING_POTENT_NODE, 80, 40),
            ),
        ),
    ))
}

{
    let skillId = Weapon.SwordOfIsaach;
    // Sword of Isaach
    // Mt: 16
    // Rng: 1
    // Accelerates Special trigger (cooldown count-1).

    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of turn,
        // if unit's HP ≥ 25%,
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_TURN_NODE(
            // to unit and allies within 2 spaces of unit for 1 turn.
            FOR_EACH_TARGET_AND_TARGETS_ALLY_WITHIN_2_SPACES_OF_TARGET_NODE(
                // grants Atk/Spd+6,
                GRANTS_STATS_PLUS_AT_START_OF_TURN_NODE(6, 6, 0, 0),
                // [Potent Follow],
                // and "neutralizes foe's bonuses during combat"
                GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(
                    StatusEffectType.PotentFollow,
                    StatusEffectType.NeutralizesFoesBonusesDuringCombat),
            ),
        ),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of combat,
        // if unit's HP ≥ 25%,
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE(
            // grants bonus to unit's Atk/Spd/Def/Res = 5 + 15% of unit's Spd at start of combat,
            GRANTS_ALL_STATS_PLUS_N_TO_UNIT_DURING_COMBAT_NODE(
                ADD_NODE(5, PERCENTAGE_NODE(15, UNITS_SPD_AT_START_OF_COMBAT_NODE))
            ),
            // and also,
            // if [Potent Follow X%) has triggered and X ≤ 99, then X = 100,
            POTENT_FOLLOW_X_PERCENTAGE_HAS_TRIGGERED_AND_X_LTE_99_THEN_X_IS_N_NODE(100),
            X_NUM_NODE(
                // unit deals +Y x 5 damage
                UNIT_DEALS_DAMAGE_EXCLUDING_AOE_SPECIALS_NODE(MULT_NODE(READ_NUM_NODE, 5)),
                // and reduces damage from foe's first attack by Y x 3 during combat
                // ("first attack" normally means only the first strike; for effects that grant "unit attacks twice," it means the first and second strikes),
                REDUCES_DAMAGE_FROM_FOES_FIRST_ATTACK_BY_N_DURING_COMBAT_INCLUDING_TWICE_NODE(MULT_NODE(READ_NUM_NODE, 3)),
                // and also,
                // when foe's attack triggers foe's Special,
                // reduces damage by Y x 3 (excluding area-of-effect Specials).
                REDUCES_DAMAGE_WHEN_FOES_SPECIAL_EXCLUDING_AOE_SPECIAL_NODE(MULT_NODE(READ_NUM_NODE, 3)),

                // (Y = number of Bonus effects active on unit, excluding stat bonuses + number of Penalty effects active on foe, excluding stat penalties; max 5; excluding area-of-effect Specials),
                ENSURE_MAX_NODE(NUM_OF_BONUS_ON_UNIT_PLUS_NUM_OF_PENALTY_ON_FOE_EXCLUDING_STAT_NODE, 5),
            ),
            // At start of combat,
            // if unit's HP ≥ 25%,
            // restores 7 HP to unit after combat.
            RESTORES_7_HP_TO_UNIT_AFTER_COMBAT_NODE,
        ),
    ));
}

{
    let skillId = getStatusEffectSkillId(StatusEffectType.PotentFollow);
    WHEN_APPLIES_POTENT_EFFECTS_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        APPLY_POTENT_EFFECT_NODE,
    ))
}

{
    let skillId = Special.CrusadersAstra;
    NORMAL_ATTACK_SPECIAL_SET.add(skillId);
    setSpecialCount(skillId, 2);
    // Crusader's Astra
    // When Special triggers,
    WHEN_APPLIES_SPECIAL_EFFECTS_AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // boosts damage by 40% of unit's Spa and
        BOOSTS_DAMAGE_WHEN_SPECIAL_TRIGGERS_NODE(
            PERCENTAGE_NODE(40, UNITS_SPD_DURING_COMBAT_NODE),
        ),
        // neutralizes foe's "reduces damage by X%" effects from foe's non-Special skills.
        WHEN_SPECIAL_TRIGGERS_NEUTRALIZES_FOES_REDUCES_DAMAGE_BY_PERCENTAGE_EFFECTS_FROM_FOES_NON_SPECIAL_EXCLUDING_AOE_SPECIALS_NODE,
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // Grants Special cooldown count-1 to unit before unit's first attack and
        GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_N_TO_TARGET_BEFORE_TARGETS_FIRST_ATTACK_DURING_COMBAT_NODE(1),
        // before each of unit's follow-up attacks during combat,
        GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_N_TO_TARGET_BEFORE_EACH_OF_TARGETS_FOLLOW_UP_ATTACK_DURING_COMBAT_NODE(1),
        // and also,
    ));
    AT_START_OF_ATTACK_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // when unit's Special is triggered during a follow-up attack,
        IF_NODE(AND_NODE(CAN_ACTIVATE_ATTACKER_SPECIAL_NODE, IS_TARGETS_FOLLOW_UP_OR_POTENT_FOLLOW_UP_ATTACK_NODE),
            // prevents foe's Specials that are triggered by unit's attack.
            PREVENTS_TARGETS_FOES_SPECIALS_THAT_ARE_TRIGGERED_BY_TARGETS_ATTACK_NODE,
        ),
    ));
    AT_APPLYING_ONCE_PER_COMBAT_DAMAGE_REDUCTION_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        IF_NODE(
            // If unit's or foe's Special is ready or triggered before or during this combat,
            IF_UNITS_OR_FOES_SPECIAL_IS_READY_OR_UNITS_OR_FOES_SPECIAL_TRIGGERED_BEFORE_OR_DURING_COMBAT_NODE,
            // reduces damage from foe's next attack by 40% (once per combat; excluding area-of-effect Specials).
            new ReducesDamageFromTargetsFoesNextAttackByNPercentOncePerCombatNode(40),
        ),
    ));
}

{
    let skillId = PassiveC.BrutalTempest;
    // Brutal Tempest
    // Enables (Canto (Dist. +1; Max 4)) .
    enablesCantoDist(skillId, 1, 4);
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of turn,
        // unit can move 1 extra space (that turn only; does not stack).
        GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.MobilityIncreased),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // Grants bonus to unit's Atk/Spd/Def/Res during combat = number of spaces from start position to end position of whoever initiated combat (max 3).
        GRANTS_ALL_STATS_PLUS_N_TO_TARGET_DURING_COMBAT_NODE(
            ENSURE_MAX_NODE(NUMBER_OF_SPACES_FROM_START_POSITION_TO_END_POSITION_OF_WHOEVER_INITIATED_COMBAT, 3),
        ),
    ));
}

{
    let skillId = Weapon.JehannaLancePlus;
    // If a skill compares unit's Spd to a foe's or ally's Spd,
    // treats unit's Spd as if granted +7.
    AT_COMPARING_STATS_HOOKS.addSkill(skillId, () => STATS_NODE(0, 7, 0, 0));

    // At start of player phase or enemy phase,
    let nodeFunc = () => new SkillEffectNode(
        // if unit is within 2 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_2_SPACES_OF_TARGETS_ALLY_NODE,
            // to unit and allies within 2 spaces of unit for 1 turn.
            FOR_EACH_TARGET_AND_TARGETS_ALLY_WITHIN_2_SPACES_OF_TARGET_NODE(
                // grants Atk/Spd+6,
                GRANTS_STATS_PLUS_AT_START_OF_TURN_NODE(6, 6, 0, 0),
                // (Dodge),
                // and
                // "neutralizes penalties on unit during combat"
                GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.Dodge, StatusEffectType.NeutralizesPenalties),
            ),
        ),
    );
    AT_START_OF_TURN_HOOKS.addSkill(skillId, nodeFunc);
    AT_START_OF_ENEMY_PHASE_HOOKS.addSkill(skillId, nodeFunc);

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit is within 3 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_TARGETS_ALLY_NODE,
            // grants Atk/Spd/Def/Res+5 to unit and
            GRANTS_ALL_STATS_PLUS_5_TO_UNIT_DURING_COMBAT_NODE,
            // reduces damage from foe's first attack by 7 during combat
            // ("first attack" normally means only the first strike; for effects that grant "unit attacks twice," it means the first and second strikes),
            REDUCES_DAMAGE_FROM_FOES_FIRST_ATTACK_BY_N_DURING_COMBAT_INCLUDING_TWICE_NODE(7),
            // and unit's next attack deals damage = total
            // damage reduced from foe's first attack (by any source,
            // including other skills). Resets at end of combat.
            TARGETS_NEXT_ATTACK_DEALS_DAMAGE_EQ_TOTAL_DAMAGE_REDUCED_FROM_TARGETS_FOES_FIRST_ATTACK_NODE,
        ),
    ));
}

{
    let skillId = Hero.HarmonizedMarisa;
    WHEN_TRIGGERS_DUO_OR_HARMONIZED_EFFECT_HOOKS_MAP.addValue(skillId,
        new SkillEffectNode(
            // Grants "unit can move 1 extra space" to unit (that turn only; does not stack).
            GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.MobilityIncreased),
            // to unit and allies from the same titles as unit for 1 turn.
            FOR_EACH_UNIT_FROM_SAME_TITLES_NODE(
                // Grants [Resonance: Blades) and "unit cannot be slowed by terrain (does not apply to impassable terrain)"
                GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(
                    StatusEffectType.ResonantBlades, StatusEffectType.UnitCannotBeSlowedByTerrain),
            ),
        ),
    );

    // Once used,
    // Harmonized Skill cannot be activated again right away. At start of every third turn,
    // if Harmonized Skill has already been used,
    // unit can use Harmonized Skill again.
    RESET_DUO_OR_HARMONIZED_SKILL_EVERY_3_TURNS_SET.add(skillId);
}

{
    let skillId = PassiveB.AssaultForce;
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit initiates combat or is within 2 spaces of an ally,
        IF_UNIT_INITIATES_COMBAT_OR_IS_WITHIN_2_SPACES_OF_AN_ALLY(
            // inflicts Spd/Def-4 on foe,
            INFLICTS_STATS_MINUS_ON_FOE_DURING_COMBAT_NODE(0, 4, 4, 0),
            // neutralizes penalties on unit,
            NEUTRALIZES_PENALTIES_ON_UNIT_NODE,
            // deals damage = 20% of the greater of unit's Spd or Def
            // (excluding area-of-effect Specials),
            DEALS_DAMAGE_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS(
                20, MAX_NODE(UNITS_SPD_DURING_COMBAT_NODE, UNITS_DEF_DURING_COMBAT_NODE)),
            // and reduces the percentage of foe's non-Special "reduce damage by X%" skills by 50% during combat (excluding area-of-effect Specials).
            REDUCES_PERCENTAGE_OF_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE,
        ),
    ));
}

{
    let skillId = Weapon.LaconicAxe;
    // Accelerates Special trigger (cooldown count-1).
    // Enables [Canto (2)] .
    enablesCantoN(skillId, 2);

    FOR_ALLIES_GRANTS_STATS_PLUS_TO_ALLIES_DURING_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // Grants Atk/Spd/Def/Res+4 to allies within 3 rows or 3 columns centered on unit during combat.
        IF_NODE(IS_TARGET_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_SKILL_OWNER_NODE,
            GRANTS_ALL_STATS_PLUS_N_TO_TARGET_DURING_COMBAT_NODE(4),
        ),
    ));

    FOR_ALLIES_GRANTS_EFFECTS_TO_ALLIES_DURING_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // For target ally within 3 rows or 3 columns centered on unit,
        IF_NODE(IS_TARGET_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_SKILL_OWNER_NODE,
            // if Savior is not triggered,
            IF_NODE(NOT_NODE(IS_TARGETS_SAVIOR_TRIGGERED_NODE),
                // (If support partner is on player team, targets any support partner;
                // otherwise, targets ally with the highest max HP on player team, excluding unit.)
                // that ally attacks twice during their combat.
                IF_ELSE_NODE(IS_THERE_SKILL_OWNERS_PARTNER_ON_MAP_NODE,
                    IF_NODE(ARE_TARGET_AND_SKILL_OWNER_PARTNERS_NODE,
                        TARGET_ATTACKS_TWICE_EVEN_IF_TARGETS_FOE_INITIATES_COMBAT_NODE,
                    ),
                    IF_NODE(EQ_NODE(TARGETS_MAX_HP_NODE, HIGHEST_HP_AMONG_SKILL_OWNERS_ALLIES),
                        TARGET_ATTACKS_TWICE_EVEN_IF_TARGETS_FOE_INITIATES_COMBAT_NODE,
                    ),
                ),
            ),
        ),
    ));

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If target ally is within 3 rows or 3 columns centered on unit,
        // unit attacks twice during combat.
        COND_OP(IS_THERE_SKILL_OWNERS_PARTNER_ON_MAP_NODE,
            IF_NODE(
                IS_THERE_TARGETS_ALLY_ON_MAP_NODE(
                    AND_NODE(
                        IS_TARGET_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_SKILL_OWNER_NODE,
                        ARE_TARGET_AND_SKILL_OWNER_PARTNERS_NODE)),
                TARGET_ATTACKS_TWICE_EVEN_IF_TARGETS_FOE_INITIATES_COMBAT_NODE,
            ),
            IF_NODE(
                IS_THERE_TARGETS_ALLY_ON_MAP_NODE(
                    AND_NODE(
                        IS_TARGET_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_SKILL_OWNER_NODE,
                        EQ_NODE(TARGETS_MAX_HP_NODE, HIGHEST_HP_AMONG_SKILL_OWNERS_ALLIES)),
                ),
                TARGET_ATTACKS_TWICE_EVEN_IF_TARGETS_FOE_INITIATES_COMBAT_NODE,
            ),
        ),

        // If unit initiates combat or if an ally is within 3 rows or 3 columns centered on unit,
        IF_NODE(OR_NODE(DOES_UNIT_INITIATE_COMBAT_NODE, IS_THERE_ALLY_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_UNIT_NODE),
            // grants bonus to unit's Atk/Spd/Def/Res =
            // number of allies within 3 rows or 3 columns centered on unit x 3, + 5 (max 14),
            GRANTS_ALL_STATS_PLUS_N_TO_UNIT_DURING_COMBAT_NODE(
                ENSURE_MAX_NODE(
                    ADD_NODE(MULT_NODE(NUM_OF_ALLIES_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_UNIT_NODE, 3), 5), 14),
            ),
            // deals damage = 20% of unit's Spd (excluding area-of-effect Specials),
            DEALS_DAMAGE_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS(20, UNITS_SPD_DURING_COMBAT_NODE),
            // reduces damage from foe's first attack by 20% of unit's Spd,
            // ("first attack" normally means only the first strike; for effects that grant "unit attacks twice," it means the first and second strikes),
            REDUCES_DAMAGE_FROM_FOES_FIRST_ATTACK_BY_PERCENTAGE_OF_TARGETS_STAT_DURING_COMBAT_INCLUDING_TWICE_NODE(
                20, UNITS_SPD_DURING_COMBAT_NODE),
            // and neutralizes effects that inflict "Special cooldown charge -X" on unit during combat,
            NEUTRALIZES_EFFECTS_THAT_INFLICT_SPECIAL_COOLDOWN_CHARGE_MINUS_X_ON_UNIT,
            // and restores 7 HP to unit after combat.
            RESTORES_7_HP_TO_UNIT_AFTER_COMBAT_NODE,
        ),
    ));
}

{
    let skillId = Weapon.JehannaDaggerPlus;
    // If a skill compares unit's Spd to a foe's or ally's Spd,
    // treats unit's Spd as if granted +7.
    AT_COMPARING_STATS_HOOKS.addSkill(skillId, () => STATS_NODE(0, 7, 0, 0));

    // At start of player phase or enemy phase,
    let nodeFunc = () => new SkillEffectNode(
        // if unit is within 2 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_2_SPACES_OF_TARGETS_ALLY_NODE,
            // to unit and allies within 2 spaces of unit for 1 turn.
            FOR_EACH_TARGET_AND_TARGETS_ALLY_WITHIN_2_SPACES_OF_TARGET_NODE(
                // grants Atk/Spd+6,
                GRANTS_STATS_PLUS_AT_START_OF_TURN_NODE(6, 6, 0, 0),
                // (Dodge),
                // and
                // "neutralizes penalties on unit during combat"
                GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.Dodge, StatusEffectType.NeutralizesPenalties),
            ),
        ),
    );
    AT_START_OF_TURN_HOOKS.addSkill(skillId, nodeFunc);
    AT_START_OF_ENEMY_PHASE_HOOKS.addSkill(skillId, nodeFunc);

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit is within 3 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_TARGETS_ALLY_NODE,
            // grants Atk/Spd/Def/Res+5 to unit and
            GRANTS_ALL_STATS_PLUS_5_TO_UNIT_DURING_COMBAT_NODE,
            // reduces damage from foe's first attack by 7 during combat
            // ("first attack" normally means only the first strike; for effects that grant "unit attacks twice," it means the first and second strikes),
            REDUCES_DAMAGE_FROM_FOES_FIRST_ATTACK_BY_N_DURING_COMBAT_INCLUDING_TWICE_NODE(7),
            // and unit's next attack deals damage = total
            // damage reduced from foe's first attack (by any source,
            // including other skills). Resets at end of combat.
            TARGETS_NEXT_ATTACK_DEALS_DAMAGE_EQ_TOTAL_DAMAGE_REDUCED_FROM_TARGETS_FOES_FIRST_ATTACK_NODE,
            // Effect: (Dagger 7)
        ),
    ));
}

{
    let skillId = Weapon.SwirlingScimitar;
    // Accelerates Special trigger (cooldown count-1).

    // If a skill compares unit's Spd to a foe's or ally's Spd,
    // treats unit's Spd as if granted +7.
    AT_COMPARING_STATS_HOOKS.addSkill(skillId, () => STATS_NODE(0, 7, 0, 0));

    // At start of player phase or enemy phase,
    let nodeFunc = () => new SkillEffectNode(
        // if unit is within 2 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_2_SPACES_OF_TARGETS_ALLY_NODE,
            // to unit and allies within 2 spaces of unit for 1 turn.
            FOR_EACH_TARGET_AND_TARGETS_ALLY_WITHIN_2_SPACES_OF_TARGET_NODE(
                // grants Atk/Spd+6,
                GRANTS_STATS_PLUS_AT_START_OF_TURN_NODE(6, 6, 0, 0),
                // [Dodge],
                // and
                // "neutralizes penalties on unit during combat"
                GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.Dodge, StatusEffectType.NeutralizesPenalties),
            ),
        ),
    );
    AT_START_OF_TURN_HOOKS.addSkill(skillId, nodeFunc);
    AT_START_OF_ENEMY_PHASE_HOOKS.addSkill(skillId, nodeFunc);

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit is within 3 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_TARGETS_ALLY_NODE,
            // grants bonus to unit's Atk/Spd/Def/Res based on the number of times unit has been enhanced using Dragonflowers
            // (one or more times grants +14, zero times grants + 10),
            GRANTS_ALL_STATS_PLUS_N_TO_UNIT_DURING_COMBAT_NODE(
                COND_OP(GTE_NODE(NUM_OF_TARGETS_DRAGONFLOWERS_NODE, 1), 14, 10)),
            // grants Special cooldown count-2 to unit before foe's first attack,
            GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_N_TO_TARGET_BEFORE_TARGETS_FOES_FIRST_ATTACK_DURING_COMBAT_NODE(2),
            // and reduces damage from foe's first attack by 25% of unit's Spd during combat
            // ("first attack" normally means only the first strike; for effects that grant "unit attacks twice," it means the first and second strikes),
            REDUCES_DAMAGE_FROM_FOES_FIRST_ATTACK_BY_PERCENTAGE_OF_TARGETS_STAT_DURING_COMBAT_INCLUDING_TWICE_NODE(25, UNITS_SPD_DURING_COMBAT_NODE),
            // and unit's next
            // attack deals damage = total damage reduced from foe's
            // first attack (by any source, including other skills).
            // Resets at end of combat.
            TARGETS_NEXT_ATTACK_DEALS_DAMAGE_EQ_TOTAL_DAMAGE_REDUCED_FROM_TARGETS_FOES_FIRST_ATTACK_NODE,
        ),
        // If unit is within 3 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_TARGETS_ALLY_NODE,
            // restores 7 HP to unit after combat.
            RESTORES_7_HP_TO_UNIT_AFTER_COMBAT_NODE,
        ),
    ));
}

{
    let skillId = PassiveC.TimePulseEdge;
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of turn,
        // if unit's Special cooldown count is at its maximum value,
        // grants Special cooldown count-1 to unit.
        IF_TARGETS_SPECIAL_COOLDOWN_COUNT_IS_AT_ITS_MAXIMUM_VALUE_GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_X_NODE(1),
    ));

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        X_NUM_NODE(
            // Grants bonus to unit's Atk/Spd during combat =
            GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE(READ_NUM_NODE, READ_NUM_NODE, 0, 0),
            // unit's maximum Special cooldown count value + 2,
            ADD_NODE(TARGETS_MAX_SPECIAL_COUNT_NODE, 2),
        ),
    ));

    AFTER_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // and also,
        // if unit's Special cooldown count is at its maximum value after combat,
        // grants Special cooldown count-1 to unit.
        IF_TARGETS_SPECIAL_COOLDOWN_COUNT_IS_AT_ITS_MAXIMUM_VALUE_GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_X_NODE(1),
    ));
}

{
    let skillId = PassiveB.LaguzLoyalty;
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // Inflicts Atk/Spd-4 on foe during combat.
        INFLICTS_STATS_MINUS_ON_FOE_DURING_COMBAT_NODE(4, 4, 0, 0),
        // If unit's max Special cooldown count value ≥ 3 and unit's attack can trigger unit's Special,
        // or if foe's attack can trigger unit's Special,
        IF_NODE(
            OR_NODE(
                AND_NODE(
                    GTE_NODE(TARGETS_MAX_SPECIAL_COUNT_NODE, 3),
                    CAN_UNITS_ATTACK_TRIGGER_SPECIAL_NODE
                ),
                CAN_TARGETS_FOES_ATTACK_TRIGGER_TARGETS_SPECIAL_NODE
            ),
            // reduces the percentage of unit's non-Special "reduce damage by X%" skills by 50%
            // (excluding area-of-effect Specials),
            REDUCES_PERCENTAGE_OF_FOES_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE,
            // reduces damage from foe's attacks by 20% of unit's Spd (excluding area-of-effect Specials),
            REDUCES_DAMAGE_FROM_TARGETS_FOES_ATTACKS_BY_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS_NODE(
                20, UNITS_SPD_DURING_COMBAT_NODE),
            // and grants Special cooldown count-2 to unit before foe's first attack during combat,
            GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_N_TO_TARGET_BEFORE_TARGETS_FOES_FIRST_ATTACK_DURING_COMBAT_NODE(2),
            // and also,
            // if foe initiates combat,
            IF_NODE(DOES_FOE_INITIATE_COMBAT_NODE,
                // decreases Spd difference necessary for unit to make a follow-up attack by 10 and
                DECREASES_SPD_DIFF_NECESSARY_FOR_UNIT_FOLLOW_UP_NODE(10),
                // unit deals +7 damage during combat (excluding area-of-effect Specials).
                UNIT_DEALS_DAMAGE_EXCLUDING_AOE_SPECIALS_NODE(7),
            ),
        ),
    ));
}

{
    let skillId = Special.AethersPath;
    NORMAL_ATTACK_SPECIAL_SET.add(skillId);
    setSpecialCount(4);

    // When Special triggers,
    WHEN_APPLIES_SPECIAL_EFFECTS_AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // boosts damage by 75% of the greater of foe's Spd or Def and
        BOOSTS_DAMAGE_WHEN_SPECIAL_TRIGGERS_NODE(
            PERCENTAGE_NODE(75, MAX_NODE(FOES_SPD_DURING_COMBAT_NODE, FOES_DEF_DURING_COMBAT_NODE)),
        ),
        // restores 50% of unit's maximum HP.
        RESTORES_X_PERCENTAGE_OF_TARGETS_MAXIMUM_HP_NODE(50),
    ));

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // Neutralizes effects that inflict "Special cooldown charge -X" on unit,
        NEUTRALIZES_EFFECTS_THAT_INFLICT_SPECIAL_COOLDOWN_CHARGE_MINUS_X_ON_UNIT,
        // reduces the effect of [Deep Wounds) by 50%,
        REDUCES_EFFECT_OF_DEEP_WOUNDS_ON_TARGET_BY_X_PERCENT_DURING_COMBAT_NODE(50),
        // neutralizes effects that prevent unit's counterattacks,
        NEUTRALIZES_EFFECTS_THAT_PREVENT_TARGETS_COUNTERATTACKS_DURING_COMBAT_NODE,
    ));

    AT_START_OF_ATTACK_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        X_NUM_NODE(
            // and reduces damage from attacks by X% during combat
            REDUCES_DAMAGE_FROM_ATTACKS_DURING_COMBAT_BY_X_PERCENT_AS_SPECIAL_SKILL_EFFECT_PER_ATTACK_NODE(READ_NUM_NODE),
            // (X = 50 - current Special cooldown count value x 10,
            // but if unit's Special triggered during this combat, X = 50).
            COND_OP(NOT_NODE(IS_UNITS_SPECIAL_TRIGGERED),
                SUB_NODE(50, MULT_NODE(UNITS_CURRENT_SPECIAL_COOLDOWN_COUNT_DURING_COMBAT, 10)),
                50
            ),
        ),
    ));
}

{
    let skillId = getStatusEffectSkillId(StatusEffectType.IncreasesSpdDifferenceNecessaryForFoeToMakeAFollowUpAttackBy10DuringCombat);
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        INCREASES_SPD_DIFF_NECESSARY_FOR_TARGETS_FOES_FOLLOW_UP_NODE(10),
    ));
}

{
    let skillId = Weapon.SwirlingLance;
    // Accelerates Special trigger (cooldown count-1).

    // At start of player phase or enemy phase,
    let nodeFunc = () => new SkillEffectNode(
        // if unit is within 2 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_2_SPACES_OF_TARGETS_ALLY_NODE,
            // to unit and allies within 2 spaces of unit for 1 turn.
            FOR_EACH_TARGET_AND_TARGETS_ALLY_WITHIN_2_SPACES_OF_TARGET_NODE(
                // grants Spd/Def+6,
                GRANTS_STATS_PLUS_AT_START_OF_TURN_NODE(0, 6, 6, 0),
                // "increases Spd difference necessary for foe to make a follow-up attack by 10 during combat," and [Null Panic)
                GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(
                    StatusEffectType.IncreasesSpdDifferenceNecessaryForFoeToMakeAFollowUpAttackBy10DuringCombat,
                    StatusEffectType.NullPanic),
            ),
        ),
    );
    AT_START_OF_TURN_HOOKS.addSkill(skillId, nodeFunc);
    AT_START_OF_ENEMY_PHASE_HOOKS.addSkill(skillId, nodeFunc);

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit is within 3 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_TARGETS_ALLY_NODE,
            // grants bonus to unit's Atk/Spd/Def/Res = number of allies within 3 spaces of unit x 3, + 5 (max 14),
            GRANTS_ALL_STATS_PLUS_N_TO_UNIT_DURING_COMBAT_NODE(
                ENSURE_MAX_NODE(ADD_NODE(MULT_NODE(NUM_OF_TARGETS_ALLIES_WITHIN_3_SPACES_NODE, 3), 5), 14),
            ),
            // deals damage = 20% of unit's Spd (excluding area-of-effect Specials),
            DEALS_DAMAGE_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS(20, UNITS_SPD_DURING_COMBAT_NODE),
            // reduces damage from foe's attacks by 20% of unit's Spd (excluding area-of-effect Specials),
            REDUCES_DAMAGE_FROM_TARGETS_FOES_ATTACKS_BY_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS_NODE(20, UNITS_SPD_DURING_COMBAT_NODE),
            // and reduces the percentage of foe's non-Special "reduce damage by X%" skills by 50% during combat (excluding area-of-effect Specials).
            REDUCES_PERCENTAGE_OF_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE,
        ),
    ));
}

{
    // let skillId = getNormalSkillId(Weapon.GoddessAxe);
}
{
    let skillId = getRefinementSkillId(Weapon.GoddessAxe);
    HP_WITH_SKILLS_MAP.set(skillId, 5);
    ATK_WITH_SKILLS_MAP.set(skillId, 6);
    DEF_WITH_SKILLS_MAP.set(skillId, 1);
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        UNIT_MAKES_GUARANTEED_FOLLOW_UP_ATTACK_NODE,
    ));
}
{
    let skillId = getSpecialRefinementSkillId(Weapon.GoddessAxe);
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode());
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // 自分から攻撃した時、または、周囲2マス以内に味方がいる時、
        IF_UNIT_INITIATES_COMBAT_OR_IS_WITHIN_2_SPACES_OF_AN_ALLY(
            // 戦闘中、攻撃、守備+6、
            GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE(6, 0, 6, 0),
            // ダメージ+守備の15%(範囲奥義を除く)、
            DEALS_DAMAGE_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS(15, UNITS_DEF_DURING_COMBAT_NODE),
            // 自身の奥義発動カウント変動量+1(同系統効果複数時、最大値適用)、
            GRANTS_SPECIAL_COOLDOWN_CHARGE_PLUS_1_TO_UNIT_PER_ATTACK_DURING_COMBAT_NODE,
            // 戦闘後、7回復
            RESTORES_7_HP_TO_UNIT_AFTER_COMBAT_NODE,
        ),
    ));
}

{
    let skillId = Weapon.FimbulvetrMorn;
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of combat,
        // if unit's HP ≥ 25%,
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE(
            // inflicts Atk/Res-6 on foe during combat,
            INFLICTS_STATS_MINUS_ON_FOE_DURING_COMBAT_NODE(6, 0, 0, 6),
            // deals damage = 20% of unit's Res (excluding area-of-effect Specials),
            DEALS_DAMAGE_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS(20, UNITS_RES_DURING_COMBAT_NODE),
            // reduces damage from foe's first attack by 7 ("first attack" normally means only the first strike; for effects that grant "unit attacks twice," it means the first and second strikes),
            REDUCES_DAMAGE_FROM_FOES_FIRST_ATTACK_BY_N_DURING_COMBAT_INCLUDING_TWICE_NODE(7),
            // and inflicts Special cooldown charge -1 on foe per attack during combat (only highest value applied; does not stack).
            INFLICTS_SPECIAL_COOLDOWN_CHARGE_MINUS_1_ON_FOE_NODE,
        ),
    ));
}
{
    let skillId = getSpecialRefinementSkillId(Weapon.FimbulvetrMorn);
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of turn,
        // if unit's HP ≥ 25%,
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_TURN_NODE(
            IF_NODE(IS_THERE_SKILL_OWNERS_PARTNER_ON_MAP_NODE,
                FOR_EACH_UNIT_NODE(
                    // (if support partner is on player team,
                    // targets any support partner within 2 spaces of unit; otherwise,
                    UNITE_UNITS_NODE(UnitsNode.makeFromUnit(TARGET_NODE),
                        FILTER_UNITS_NODE(
                            TARGETS_ALLIES_WITHIN_2_SPACES_NODE(),
                            ARE_TARGET_AND_SKILL_OWNER_PARTNERS_NODE)),
                    // grants Atk/Res+6,【Essence Drain】,
                    // and 【Bonus Doubler】to unit and target allies for 1 turn
                    GRANTS_STATS_PLUS_AT_START_OF_TURN_NODE(6, 0, 0, 6),
                    GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.EssenceDrain, StatusEffectType.BonusDoubler),
                ),
            ),
            IF_NODE(NOT_NODE(IS_THERE_SKILL_OWNERS_PARTNER_ON_MAP_NODE),
                FOR_EACH_UNIT_NODE(
                    // targets ally with the highest Atk within 2 spaces of unit).
                    UNITE_UNITS_NODE(UnitsNode.makeFromUnit(TARGET_NODE), HIGHEST_ATK_ALLIES_WITHIN_2_SPACES_NODE),
                    GRANTS_STATS_PLUS_AT_START_OF_TURN_NODE(6, 0, 0, 6),
                    GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.EssenceDrain, StatusEffectType.BonusDoubler),
                ),
            ),
        ),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of combat,
        // if unit's HP ≥ 25%,
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE(
            // inflicts Atk/Res-6 on foe during combat,
            INFLICTS_STATS_MINUS_ON_FOE_DURING_COMBAT_NODE(6, 0, 0, 6),
            // unit makes a guaranteed follow-up attack,
            UNIT_MAKES_GUARANTEED_FOLLOW_UP_ATTACK_NODE,
            // and restores 7 HP to unit after combat.
            RESTORES_7_HP_TO_UNIT_AFTER_COMBAT_NODE,
        ),
    ));
}

{
    let skillId = getNormalSkillId(Weapon.TomeOfStorms);
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        IF_NODE(IS_FOES_HP_GTE_75_PERCENT_AT_START_OF_COMBAT_NODE,
            GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE(5, 5, 0, 0),
            NULL_UNIT_FOLLOW_UP_NODE,
        ),
    ));
}
{
    let skillId = getRefinementSkillId(Weapon.TomeOfStorms);
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit initiates combat or if foe's HP ≥ 75% at start of combat,
        IF_NODE(OR_NODE(DOES_UNIT_INITIATE_COMBAT_NODE, IS_FOES_HP_GTE_75_PERCENT_AT_START_OF_COMBAT_NODE),
            X_NUM_NODE(
                // grants bonus to unit's Atk/Spd = 6 + 15% of unit's Spd at start of combat,
                GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE(READ_NUM_NODE, READ_NUM_NODE, 0, 0),
                ADD_NODE(6, PERCENTAGE_NODE(15, UNITS_SPD_AT_START_OF_COMBAT_NODE)),
            ),
            // neutralizes foe's bonuses to Spd/Res,
            new NeutralizesFoesBonusesToStatsDuringCombatNode(false, true, false, true),
            // and neutralizes effects that guarantee foe's follow-up attacks and effects that prevent unit's follow-up attacks during combat,
            NULL_UNIT_FOLLOW_UP_NODE,
            // and also,
            // if unit's Spd > foe's Spd,
            // foe cannot counterattack.
            APPLY_SKILL_EFFECTS_AFTER_STATUS_FIXED_NODE(
                IF_NODE(GT_NODE(UNITS_SPD_DURING_COMBAT_NODE, FOES_SPD_DURING_COMBAT_NODE),
                    FOE_CANNOT_COUNTERATTACK_NODE,
                ),
            ),
        ),
    ));
}
{
    let skillId = getSpecialRefinementSkillId(Weapon.TomeOfStorms);
    // Enables【Canto (１)】.
    enablesCantoN(skillId, 1);
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of turn,
        // if unit's HP ≥ 25%,
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_TURN_NODE(
            // on closest foes and foes within 2 spaces of those foes through their next actions.
            FOR_EACH_TARGETS_CLOSEST_FOE_AND_ANY_FOE_WITHIN_2_SPACES_OF_THOSE_FOES_NODE(
                // inflicts Spd/Res-7 and【Exposure】
                INFLICTS_STATS_MINUS_AT_START_OF_TURN_NODE(0, 7, 0, 7),
                INFLICTS_STATUS_EFFECTS_AT_START_OF_TURN_NODE(StatusEffectType.Exposure),
            ),
        ),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of combat,
        // if unit's HP ≥ 25%,
        IF_NODE(IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE,
            // grants Atk/Spd+6 to unit during combat and deals damage = 20% of unit's Spd (excluding area-of-effect Specials).
            GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE(6, 6, 0, 0),
            DEALS_DAMAGE_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS(20, UNITS_SPD_DURING_COMBAT_NODE),
        ),
    ));
}

{
    let skillId = getNormalSkillId(Weapon.IndignantBow);
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        IF_NODE(OR_NODE(DOES_FOE_INITIATE_COMBAT_NODE, EQ_NODE(FOES_HP_PERCENTAGE_AT_START_OF_COMBAT_NODE, 100)),
            GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE(6, 0, 0, 0),
            INFLICTS_STATS_MINUS_ON_FOE_DURING_COMBAT_NODE(6, 0, 0, 0),
            new NeutralizesPenaltiesToUnitsStatsNode(true, false, false, false),
            new NeutralizesFoesBonusesToStatsDuringCombatNode(true, false, false, false),
        ),
    ));
}
{
    let skillId = getRefinementSkillId(Weapon.IndignantBow);
    // Disables foe's skills that "calculate damage using the lower of foe's Def or Res" (including area-of-effect Specials).
    DISABLES_FOES_SKILLS_THAT_CALCULATE_DAMAGE_USING_THE_LOWER_OF_FOES_DEF_OR_RES_SET.add(skillId);
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If foe initiates combat or foe's HP ≥ 75% at start of combat,
        IF_FOE_INITIATES_COMBAT_OR_IF_FOES_HP_GTE_75_PERCENT_AT_START_OF_COMBAT(
            // grants Atk/Def/Res+6 and Spd+5 to unit,
            GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE(6, 0, 6, 6),
            GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE(0, 5, 0, 0),
            // neutralizes unit's penalties to Atk/Spd/Res
            new NeutralizesPenaltiesToUnitsStatsNode(true, true, false, false),
            // and foe's bonuses to Atk/Spd (from skills like Fortify, Rally, etc.),
            new NeutralizesFoesBonusesToStatsDuringCombatNode(true, true, false, false),
            // and deals damage = 20% of unit's Res during combat (excluding area-of-effect Specials),
            DEALS_DAMAGE_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS(20, UNITS_RES_DURING_COMBAT_NODE),
            // and also,
            // when unit's Special triggers,
            // calculates damage using 150% of unit's Res instead of the value of unit's Atk (excluding area-of-effect Specials).
            new CalculatesDamageUsingXPercentOfTargetsStatInsteadOfAtkWhenSpecialNode(STATUS_INDEX.Res, 150),
        ),
    ));
}
{
    let skillId = getSpecialRefinementSkillId(Weapon.IndignantBow);
    // Accelerates Special trigger (cooldown count-1).
    ACCELERATES_SPECIAL_TRIGGER_SET.add(skillId);
    // For allies within 3 spaces of unit,
    FOR_ALLIES_GRANTS_STATS_PLUS_TO_ALLIES_DURING_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_TARGETS_ALLY_NODE,
            // grants Atk/Spd/Res+5,
            GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE(5, 5, 0, 99),
        ),
    ));
    FOR_ALLIES_GRANTS_EFFECTS_TO_ALLIES_DURING_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_TARGETS_ALLY_NODE,
            // neutralizes effects that inflict "Special cooldown charge -X" on ally,
            NEUTRALIZES_EFFECTS_THAT_INFLICT_SPECIAL_COOLDOWN_CHARGE_MINUS_X_ON_UNIT,
            // and reduces damage from foe's first attack by 7 during their combat ("first attack" normally means only the first strike; for effects that grant "unit attacks twice," it means the first and second strikes).
            REDUCES_DAMAGE_FROM_FOES_FIRST_ATTACK_BY_N_DURING_COMBAT_INCLUDING_TWICE_NODE(7),
        ),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit is within 3 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_TARGETS_ALLY_NODE,
            // grants Atk/Spd/Def/Res+5 to unit,
            GRANTS_ALL_STATS_PLUS_5_TO_UNIT_DURING_COMBAT_NODE,
            // neutralizes effects that inflict "Special cooldown charge -X" on unit,
            NEUTRALIZES_EFFECTS_THAT_INFLICT_SPECIAL_COOLDOWN_CHARGE_MINUS_X_ON_UNIT,
            // grants Special cooldown count-1 to unit before unit's first attack,
            GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_N_TO_TARGET_BEFORE_TARGETS_FIRST_ATTACK_DURING_COMBAT_NODE(1),
            // and reduces damage from foe's attacks by 10 during combat (including from area-of-effect Specials; excluding Røkkr area-of-effect Specials),
            REDUCES_DAMAGE_FROM_TARGETS_FOES_ATTACKS_BY_X_DURING_COMBAT_NODE(10),
            // and also,
            // when foe's attack triggers foe's Special,
            // reduces damage from foe's attacks by an additional 10 (including from area-of-effect Specials; excluding Røkkr area-of-effect Specials).
            new ReducesDamageWhenFoesSpecialExcludingAoeSpecialNode(10),
        ),
    ));
    BEFORE_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // and reduces damage from foe's attacks by 10 during combat (including from area-of-effect Specials; excluding Røkkr area-of-effect Specials),
        new ReducesDamageBeforeCombatNode(10),
        // when foe's attack triggers foe's Special,
        // reduces damage from foe's attacks by an additional 10 (including from area-of-effect Specials; excluding Røkkr area-of-effect Specials).
        new ReducesDamageBeforeCombatNode(10),
    ));
}

{
    let skillId = getNormalSkillId(Weapon.JokersWild);
    // Grants HP+5.
    // Unit's Atk/Spd/Def/Res = highest respective stat from among allies within 2 spaces during combat.
    // (Calculates each stat bonus independently at start of combat. If unit's stat is highest, unit's stat will decrease.)
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode());
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        IF_NODE(IS_TARGET_WITHIN_2_SPACES_OF_TARGETS_ALLY_NODE,
            TARGETS_STATS_ARE_HIGHEST_STATS_FROM_NODE(
                HIGHEST_STATS_ON_EACH_STAT_BETWEEN_TARGET_ALLIES_WITHIN_N_SPACES_NODE(2),
            ),
        ),
    ));
}
{
    let skillId = getRefinementSkillId(Weapon.JokersWild);
    // Grants HP+5.
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode());
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // Unit can counterattack regardless of foe's range.
        TARGET_CAN_COUNTERATTACK_REGARDLESS_OF_RANGE_NODE,
        // If unit is within 3 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_TARGETS_ALLY_NODE,
            // grants Atk/Spd/Def/Res+5,
            GRANTS_ALL_STATS_PLUS_5_TO_UNIT_DURING_COMBAT_NODE,
            // grants bonus to unit's Atk/Spd/Def/Res = highest respective stat from among allies within 3 spaces - unit's stat values (calculates each stat bonus independently at start of combat; if unit's stat is highest,
            // unit's stat will decrease),
            IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_TARGETS_ALLY_NODE,
                TARGETS_STATS_ARE_HIGHEST_STATS_FROM_NODE(
                    HIGHEST_STATS_ON_EACH_STAT_BETWEEN_TARGET_ALLIES_WITHIN_N_SPACES_NODE(3),
                ),
            ),
            // and deals damage = 20% of unit's Spd during combat (excluding area-of-effect Specials)."
            DEALS_DAMAGE_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS(20, UNITS_SPD_DURING_COMBAT_NODE),
        ),
    ));
}
{
    let skillId = getSpecialRefinementSkillId(Weapon.JokersWild);
    // At start of player phase or enemy phase,
    let nodeFunc = () => new SkillEffectNode(
        // to allies within 3 spaces of unit for 1 turn.
        FOR_EACH_TARGET_AND_TARGETS_ALLY_WITHIN_3_SPACES_OF_TARGET_NODE(
            // grants Atk/Spd/Def/Res+6,【Hexblade】, and【Null Panic】
            GRANTS_STATS_PLUS_AT_START_OF_TURN_NODE(6, 6, 6, 6),
            GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.Hexblade, StatusEffectType.NullPanic),
        )
    );
    AT_START_OF_TURN_HOOKS.addSkill(skillId, nodeFunc);
    AT_START_OF_ENEMY_PHASE_HOOKS.addSkill(skillId, nodeFunc);

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit is within 3 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_TARGETS_ALLY_NODE,
            // grants Atk/Spd/Def/Res+5 and
            GRANTS_ALL_STATS_PLUS_5_TO_UNIT_DURING_COMBAT_NODE,
            APPLY_SKILL_EFFECTS_AFTER_STATUS_FIXED_NODE(
                // reduces damage from foe's first attack by 20% of the greater of unit's Def or Res during combat
                // ("first attack" normally means only the first strike; for effects that grant "unit attacks twice," it means the first and second strikes),
                REDUCES_DAMAGE_FROM_FOES_FIRST_ATTACK_BY_N_DURING_COMBAT_INCLUDING_TWICE_NODE(
                    PERCENTAGE_NODE(20, MAX_NODE(UNITS_DEF_DURING_COMBAT_NODE, UNITS_RES_DURING_COMBAT_NODE)),
                ),
            ),
        ),
        // and also,
        // if foe's attack can trigger foe's Special and unit's Res ≥ foe's Res+5,
        // inflicts Special cooldown count+1 on foe before foe's first attack during combat (cannot exceed the foe's maximum Special cooldown).
        INFLICTS_SPECIAL_COOLDOWN_COUNT_1_ON_FOE_BEFORE_FOES_FIRST_ATTACK_DURING_COMBAT_BY_DRAGON_NODE,
    ));
}

{
    let skillId = getNormalSkillId(Weapon.DazzlingBreath);
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        IF_FOE_INITIATES_COMBAT_OR_IF_FOES_HP_GTE_75_PERCENT_AT_START_OF_COMBAT(
            INFLICTS_ALL_STATS_MINUS_5_ON_FOE_DURING_COMBAT_NODE,
            FOE_CANNOT_MAKE_FOLLOW_UP_ATTACK_NODE,
            IF_NODE(IS_TARGET_WITHIN_2_SPACES_OF_TARGETS_ALLY_NODE,
                INFLICTS_SPECIAL_COOLDOWN_CHARGE_MINUS_1_ON_FOE_NODE,
            ),
        ),
    ));
}
{
    let skillId = getRefinementSkillId(Weapon.DazzlingBreath);
    // Grants Atk+3. If foe's Range = 2, calculates damage using the lower of foe's Def or Res.
    WHEN_INFLICTS_STATS_MINUS_TO_FOES_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // Inflicts Atk/Spd/Def/Res-5 on foes within 3 rows or 3 columns centered on unit and
        IF_NODE(IS_TARGET_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_SKILL_OWNER_NODE,
            INFLICTS_ALL_STATS_MINUS_5_ON_FOE_DURING_COMBAT_NODE,
        ),
    ));
    WHEN_INFLICTS_EFFECTS_TO_FOES_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // on foes within 3 rows or 3 columns centered on unit and
        IF_NODE(IS_TARGET_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_SKILL_OWNER_NODE,
            // neutralizes those foes' bonuses (from skills like Fortify, Rally, etc.) during combat.
            NEUTRALIZES_FOES_BONUSES_TO_STATS_DURING_COMBAT_NODE,
        ),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If foe initiates combat or if foe's HP ≥ 75% at start of combat,
        IF_FOE_INITIATES_COMBAT_OR_IF_FOES_HP_GTE_75_PERCENT_AT_START_OF_COMBAT(
            // inflicts Atk/Spd/Def/Res-5 on foe,
            INFLICTS_ALL_STATS_MINUS_5_ON_FOE_DURING_COMBAT_NODE,
            // foe cannot make a follow-up attack,
            FOE_CANNOT_MAKE_FOLLOW_UP_ATTACK_NODE,
            // deals damage = 20% of unit's Res (excluding area-of-effect Specials),
            DEALS_DAMAGE_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS(20, UNITS_RES_DURING_COMBAT_NODE),
            // and inflicts Special cooldown charge -1 on foe per attack during combat
            // (only highest value applied; does not stack).
            INFLICTS_SPECIAL_COOLDOWN_CHARGE_MINUS_1_ON_FOE_NODE,
        ),
    ));
}
{
    let skillId = getSpecialRefinementSkillId(Weapon.DazzlingBreath);
    // Foes with Range = 1 cannot move through spaces adjacent to unit (does not affect foes with Pass skills).
    // Foes with Range = 2 cannot move through spaces within 2 spaces of unit (does not affect foes with Pass skills).
    setCannotMoveThroughSpacesSkill(skillId);

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit is within 3 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_TARGETS_ALLY_NODE,
            // inflicts Atk/Spd/Def/Res-5 on foe and
            INFLICTS_ALL_STATS_MINUS_5_ON_FOE_DURING_COMBAT_NODE,
            APPLY_SKILL_EFFECTS_AFTER_STATUS_FIXED_NODE(
                // reduces damage from foe's attacks by 20% of unit's Res during combat (excluding area-of-effect Specials),
                REDUCES_DAMAGE_FROM_TARGETS_FOES_ATTACKS_BY_X_DURING_COMBAT_NODE(
                    PERCENTAGE_NODE(20, UNITS_RES_DURING_COMBAT_NODE)),
            ),
            // and also,
            // if foe's attack can trigger foe's Special and unit's Res ≥ foe's Res+5,
            // inflicts Special cooldown count+1 on foe before foe's first attack during combat (cannot exceed the foe's maximum Special cooldown).
            INFLICTS_SPECIAL_COOLDOWN_COUNT_1_ON_FOE_BEFORE_FOES_FIRST_ATTACK_DURING_COMBAT_BY_DRAGON_NODE,
        ),
    ));
}

{
    let skillId = getNormalSkillId(Weapon.NewDawn);
    // Effective against armored and cavalry foes. Grants Atk+3.
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit initiates combat or if unit is within 2 spaces of an ally,
        IF_UNIT_INITIATES_COMBAT_OR_IS_WITHIN_2_SPACES_OF_AN_ALLY(
            // grants Atk/Res+6 during combat and unit makes a guaranteed follow-up attack.
            GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE(6, 0, 0, 6),
            UNIT_MAKES_GUARANTEED_FOLLOW_UP_ATTACK_NODE,
        ),
        // If unit's HP ≤ 50% and unit initiates combat,
        IF_NODE(AND_NODE(IS_UNITS_HP_LTE_50_PERCENT_AT_START_OF_COMBAT_NODE, DOES_UNIT_INITIATE_COMBAT_NODE),
            // unit can make a follow-up attack before foe can counterattack.
            UNIT_CAN_MAKE_FOLLOW_UP_ATTACK_BEFORE_FOES_NEXT_ATTACK_NODE,
        ),
    ));
}
{
    let skillId = getRefinementSkillId(Weapon.NewDawn);
    // 重装、騎馬特効
    // 攻撃+3
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // 自分から攻撃した時、または、周囲2マス以内に味方がいる時、
        IF_UNIT_INITIATES_COMBAT_OR_IS_WITHIN_2_SPACES_OF_AN_ALLY(
            // 戦闘中、攻撃、魔防+6、
            GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE(6, 0, 0, 6),
            // 速さ、守備+5、さらに、
            GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE(0, 5, 5, 0),
            // 攻撃、速さ、守備、魔防が戦闘開始時の魔防の10%だけ増加、
            GRANTS_ALL_STATS_PLUS_N_TO_UNIT_DURING_COMBAT_NODE(
                PERCENTAGE_NODE(10, UNITS_DEF_AT_START_OF_COMBAT_NODE),
            ),
            // 絶対追撃
            UNIT_MAKES_GUARANTEED_FOLLOW_UP_ATTACK_NODE,
            // 自分から攻撃した時、追撃可能なら自分の攻撃の直後に追撃を行う
            UNIT_CAN_MAKE_FOLLOW_UP_ATTACK_BEFORE_FOES_NEXT_ATTACK_NODE,
        ),
    ));
}
{
    let skillId = getSpecialRefinementSkillId(Weapon.NewDawn);
    // 奥義が発動しやすい(発動カウント-1)
    ACCELERATES_SPECIAL_TRIGGER_SET.add(skillId);
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode());
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // 戦闘開始時、自身のHPが25%以上なら、
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE(
            // 戦闘中、攻撃、速さ、守備、魔防+5、
            GRANTS_ALL_STATS_PLUS_5_TO_UNIT_DURING_COMBAT_NODE,
            // 攻撃、魔防の弱化を無効、
            new NeutralizesPenaltiesToUnitsStatsNode(true, false, false, true),
            // ダメージ+魔防の20％(範囲奥義を除く)、
            DEALS_DAMAGE_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS(20, UNITS_RES_DURING_COMBAT_NODE),
            // 敵の奥義以外のスキルによる「ダメージを○○％軽減」を半分無効(無効にする数値は端数切捨て)(範囲奥義を除く)
            REDUCES_PERCENTAGE_OF_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE,
        ),
    ));
}

{
    let skillId = PassiveX.TempoEcho;
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // Neutralizes effects that grant "Special cooldown charge +X" to foe or
        NEUTRALIZES_EFFECTS_THAT_GRANT_SPECIAL_COOLDOWN_CHARGE_PLUS_X_TO_FOE,
        // inflict "Special cooldown charge -X" on unit and
        NEUTRALIZES_EFFECTS_THAT_INFLICT_SPECIAL_COOLDOWN_CHARGE_MINUS_X_ON_UNIT,
        // reduces the percentage of foe's non-Special "reduce damage by X%" skills by 50% during combat (excluding area-of-effect Specials).
        REDUCES_PERCENTAGE_OF_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE,
    ));
}

{
    let skillId = PassiveB.IRemember;
    // At start of player phase or enemy phase,
    let nodeFunc = () => new SkillEffectNode(
        // if unit is within 2 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_2_SPACES_OF_TARGETS_ALLY_NODE,
            // on closest foes and foes within 2 spaces of those foes through their next actions.
            FOR_EACH_TARGETS_CLOSEST_FOE_AND_ANY_FOE_WITHIN_2_SPACES_OF_THOSE_FOES_NODE(
                // inflicts Spd/Def-7,
                INFLICTS_STATS_MINUS_AT_START_OF_TURN_NODE(0, 7, 7, 0),
                // 【Panic】, and【Sabotage】
                INFLICTS_STATUS_EFFECTS_AT_START_OF_TURN_NODE(StatusEffectType.Panic, StatusEffectType.Sabotage),
            ),
        ),
    );
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, nodeFunc);
    AT_START_OF_ENEMY_PHASE_HOOKS.addSkill(skillId, nodeFunc);

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit initiates combat or is within 2 spaces of an ally,
        IF_UNIT_INITIATES_COMBAT_OR_IS_WITHIN_2_SPACES_OF_AN_ALLY(
            // inflicts Spd/Def-5 on foe and
            INFLICTS_STATS_MINUS_ON_FOE_DURING_COMBAT_NODE(0, 5, 5, 0),
            // deals damage = 20% of unit's Spd during combat (excluding area-of-effect Specials),
            DEALS_DAMAGE_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS(20, UNITS_SPD_DURING_COMBAT_NODE),
            // and also,
            // if unit's HP > 1 and foe would reduce unit's HP to 0,
            // unit survives with 1 HP (once per combat; does not stack with non-Special effects that allow unit to survive with 1 HP if foe's attack would reduce HP to 0).
            TARGET_CAN_ACTIVATE_NON_SPECIAL_MIRACLE_NODE(0),
        ),

        // If unit initiates combat or is within 2 spaces of an ally,
        IF_UNIT_INITIATES_COMBAT_OR_IS_WITHIN_2_SPACES_OF_AN_ALLY(
            // restores 7 HP to unit after combat.
            RESTORES_7_HP_TO_UNIT_AFTER_COMBAT_NODE,
        ),
    ));
}

{
    let skillId = PassiveA.PerfectAtkSpd;
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit's HP ≥ 25% at start of combat or unit is within 3 spaces of an ally,
        IF_NODE(
            OR_NODE(IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE, IS_TARGET_WITHIN_3_SPACES_OF_TARGETS_ALLY_NODE),
            // grants Atk/Spd+7 to unit during combat,
            GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE(7, 7, 0, 0),
            // and also,
            APPLY_SKILL_EFFECTS_AFTER_STATUS_FIXED_NODE(
                // if unit's Spd > foe's Spd,
                IF_NODE(GT_NODE(UNITS_EVAL_SPD_DURING_COMBAT_NODE, FOES_EVAL_SPD_DURING_COMBAT_NODE),
                    // neutralizes effects that guarantee foe's follow-up attacks and effects that prevent unit's follow-up attacks during combat.
                    NULL_UNIT_FOLLOW_UP_NODE,
                ),
            ),
        ),
        // If unit's HP ≥ 25% at start of combat and unit is within 3 spaces of an ally,
        IF_NODE(
            OR_NODE(IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE, IS_TARGET_WITHIN_3_SPACES_OF_TARGETS_ALLY_NODE),
            // grants an additional Atk/Spd+3 to unit during combat.
            GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE(3, 3, 0, 0),
        ),
    ));
}

{
    let skillId = Weapon.DivineYewfelle;
    // Accelerates Special trigger (cooldown count-1). Effective against flying foes.
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of turn,
        // if unit is within 2 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_2_SPACES_OF_TARGETS_ALLY_NODE,
            // to unit and allies within 2 spaces for 1 turn:
            FOR_EACH_TARGET_AND_TARGETS_ALLY_WITHIN_2_SPACES_OF_TARGET_NODE(
                // grants Atk/Spd+6,
                GRANTS_STATS_PLUS_AT_START_OF_TURN_NODE(6, 6, 0, 0),
                // 【Incited】,
                // and the following status
                // "Unit can move to a space adjacent to any ally within 2 spaces."
                GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.Incited, StatusEffectType.AirOrders),
            ),
        ),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit initiates combat or is within 2 spaces of an ally,
        IF_UNIT_INITIATES_COMBAT_OR_IS_WITHIN_2_SPACES_OF_AN_ALLY(
            X_NUM_NODE(
                // grants bonus to unit's Atk/Spd = 6 + 20% of unit's Spd at start of combat,
                GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE(READ_NUM_NODE, READ_NUM_NODE, 0, 0),
                ADD_NODE(6, PERCENTAGE_NODE(20, UNITS_SPD_AT_START_OF_COMBAT_NODE)),
            ),
            X_NUM_NODE(
                // unit deals +X damage
                UNIT_DEALS_DAMAGE_EXCLUDING_AOE_SPECIALS_NODE(READ_NUM_NODE),
                // (X =
                // total number of
                // 【Bonus】effects active on unit, excluding stat bonuses, and
                // 【Penalty】effects active on foe, excluding stat penalties,
                // × 5; max 25; excluding area-of-effect Specials),
                ENSURE_MAX_NODE(
                    MULT_NODE(NUM_OF_BONUS_ON_UNIT_PLUS_NUM_OF_PENALTY_ON_FOE_EXCLUDING_STAT_NODE, 5),
                    25,
                ),
            ),
            // grants Special cooldown count-2 to unit before unit's first follow-up attack,
            new GrantsSpecialCooldownCountMinusNToTargetBeforeTargetsFirstFollowUpAttackDuringCombatNode(2),
            // and disables skills of all foes excluding foe in combat during combat.
            UNIT_DISABLES_SKILLS_OF_ALL_OTHERS_IN_COMBAT_EXCLUDING_UNIT_AND_FOE_NODE,
        ),
    ));
}

{
    let skillId = Weapon.HelpingDaggerPlus;
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of combat,
        // if unit's HP ≥ 25%,
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE(
            // grants Atk/Spd+5 to unit,
            GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE(5, 5, 0, 0),
            X_NUM_NODE(
                // grants Atk/Spd+X × 5 to unit
                GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE(MULT_NODE(READ_NUM_NODE, 5), MULT_NODE(READ_NUM_NODE, 5), 0, 0),
                // (X = the number of allies with Atk ≥ 55 within 3 rows or 3 columns centered on unit + the number of allies with Spd ≥ 40 in the same area; max 3),
                ENSURE_MAX_NODE(
                    COUNT_IF_UNITS_NODE(TARGETS_ALLIES_ON_MAP_NODE,
                        AND_NODE(
                            IS_TARGET_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_SKILL_OWNER_NODE,
                            OR_NODE(GTE_NODE(TARGETS_EVAL_ATK_ON_MAP, 55), GTE_NODE(TARGETS_EVAL_SPD_ON_MAP, 40))
                        )
                    ),
                    3,
                ),
            ),
            // and grants Special cooldown charge +1 to unit per attack during combat (only highest value applied; does not stack).
            GRANTS_SPECIAL_COOLDOWN_CHARGE_PLUS_1_TO_UNIT_PER_ATTACK_DURING_COMBAT_NODE,
        ),
    ));
}

{
    let skillId = Weapon.RampartBow;
    // Accelerates Special trigger (cooldown count-1). Effective against flying foes.
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of turn,
        // if unit's HP ≥ 25%,
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_TURN_NODE(
            // on closest foes and foes within 2 spaces of those foes through their next actions.
            FOR_EACH_TARGETS_CLOSEST_FOE_AND_ANY_FOE_WITHIN_2_SPACES_OF_THOSE_FOES_NODE(
                // inflicts Spd/Def-7,
                INFLICTS_STATS_MINUS_AT_START_OF_TURN_NODE(0, 7, 7, 0),
                // 【Exposure】, and【Deep Wounds】
                INFLICTS_STATUS_EFFECTS_AT_START_OF_TURN_NODE(StatusEffectType.Exposure, StatusEffectType.DeepWounds),
            ),
        ),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of combat,
        // if unit's HP ≥ 25%,
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE(
            // grants bonus to unit's Atk/Spd/Def/Res = number of foes within 3 rows or 3 columns centered on unit × 3, + 5 (max 14),
            GRANTS_ALL_STATS_PLUS_N_TO_UNIT_DURING_COMBAT_NODE(
                ENSURE_MAX_NODE(
                    ADD_NODE(
                        MULT_NODE(
                            NUM_OF_FOES_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_UNIT_NODE,
                            3,
                        ),
                        5,
                    ),
                    14,
                ),
            ),
            // neutralizes unit's penalties,
            NEUTRALIZES_PENALTIES_ON_UNIT_NODE,
            // deals +X damage
            // (X = number of foes within 3 spaces of target, including target, × 8; max 32; excluding area-of-effect Specials),
            UNIT_DEALS_DAMAGE_EXCLUDING_AOE_SPECIALS_NODE(
                ENSURE_MAX_NODE(
                    MULT_NODE(
                        NUM_OF_TARGETS_FOES_WITHIN_3_SPACES_OF_TARGET_NODE,
                        8,
                    ),
                    32
                ),
            ),
            // and reduces damage from foe's first attack by 7 during combat
            // ("first attack" normally means only the first strike; for effects that grant "unit attacks twice," it means the first and second strikes).
            REDUCES_DAMAGE_FROM_FOES_FIRST_ATTACK_BY_N_DURING_COMBAT_INCLUDING_TWICE_NODE(7),
        ),
    ));
}

{
    setSway(PassiveA.SwayAtkSpd, [READ_NUM_NODE, READ_NUM_NODE, 0, 0]);
    setSway(PassiveA.SwayAtkRes, [READ_NUM_NODE, 0, 0, READ_NUM_NODE]);
}

{
    let skillId = Weapon.StaffOfYngvi;
    // Accelerates Special trigger (cooldown count-1; max cooldown count value cannot be reduced below 1).
    // Foe cannot counterattack.
    //
    UNIT_CAN_MOVE_TO_A_SPACE_HOOKS.addSkill(skillId, () =>
        // Unit can move to a space adjacent to any ally within 5 spaces.
        new ForEachAllyForSpacesNode(IS_TARGET_WITHIN_5_SPACES_OF_SKILL_OWNER_NODE,
            new SkillOwnerPlacableSpacesWithinNSpacesFromSpaceNode(1, TARGETS_PLACED_SPACE_NODE),
        ),
    );
    // If a Rally or movement Assist skill is used by unit,
    let nodeFunc = () => new SkillEffectNode(
        FOR_EACH_UNIT_NODE(ASSIST_TARGETING_AND_TARGET_NODE,
            // grants【Empathy】,【Canto (１)】,
            GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.Empathy, StatusEffectType.Canto1),
            // and the following status to unit and target ally for 1 turn: "If unit initiates combat,
            // unit makes a guaranteed follow-up attack."
            GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.FollowUpAttackPlus),
        ),
    );
    AFTER_RALLY_SKILL_IS_USED_BY_UNIT_HOOKS.addSkill(skillId, nodeFunc);
    AFTER_MOVEMENT_SKILL_IS_USED_BY_UNIT_HOOKS.addSkill(skillId, nodeFunc);

    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode());
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit is within 3 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_TARGETS_ALLY_NODE,
            X_NUM_NODE(
                // grants bonus to unit's Atk/Res = 6 + 20% of unit's Res at start of combat,
                GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE(READ_NUM_NODE, 0, 0, READ_NUM_NODE),
                ADD_NODE(6, PERCENTAGE_NODE(20, UNITS_RES_AT_START_OF_COMBAT_NODE)),
            ),
            // deals damage = 20% of unit's Res (excluding area-of-effect Specials; if the "calculates damage from staff like other weapons" effect is not active,
            // damage from staff is calculated after combat damage is added),
            DEALS_DAMAGE_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS(20, UNITS_RES_DURING_COMBAT_NODE),
            // and grants Special cooldown count-1 to unit before unit's first attack during combat.
            GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_N_TO_TARGET_BEFORE_TARGETS_FIRST_ATTACK_DURING_COMBAT_NODE(1),
        ),
    ));
}

{
    let skillId = Special.LifeUnending2;
    DEFENSE_SPECIAL_SET.add(skillId);
    setSpecialCount(5);
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At the start of turn 1, grants Special cooldown count-5 to unit.
        IF_NODE(EQ_NODE(CURRENT_TURN_NODE, 1),
            GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_ON_TARGET_ON_MAP_NODE(5),
        ),
    ));

    // When Special triggers, if unit's HP > 1 and foe would reduce unit's HP to 0, unit survives with 1 HP.
    MIRACLE_AND_HEAL_SPECIAL_SET.add(skillId);

    // 奥義を発動した戦闘後、HP99回復(この効果は【回復不可】を無効、発動後、2ターンの間発動しない)
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // Reduces damage from foe's first attack by 40% during combat
        // ("first attack" normally means only the first strike; for effects that grant "unit attacks twice," it means the first and second strikes),
        REDUCES_DAMAGE_FROM_FOES_FIRST_ATTACK_BY_N_PERCENT_BY_SPECIAL_DURING_COMBAT_INCLUDING_TWICE_NODE(40),
        // and unit's next attack deals damage = total damage reduced from foe's first attack (by any source, including other skills; resets at end of combat).
        TARGETS_NEXT_ATTACK_DEALS_DAMAGE_EQ_TOTAL_DAMAGE_REDUCED_FROM_TARGETS_FOES_FIRST_ATTACK_NODE,
    ));

    // After combat, if unit's Special triggered,
    AFTER_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        IF_NODE(IS_UNITS_SPECIAL_TRIGGERED,
            // restores 99 HP (neutralizes the effects of【Deep Wounds】and will not trigger again for 2 turns after triggering).
            TARGETS_REST_SPECIAL_SKILL_AVAILABLE_TURN_NODE(2,
                RESTORE_TARGETS_HP_NEUTRALIZES_DEEP_WOUNDS_ON_MAP_NODE(99),
            ),
        ),
    ));
}

{
    let skillId = PassiveB.Prescience2;
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // ターン開始時、敵軍内で最も攻撃、速さ、守備、魔防が高い敵と、その周囲2マス以内にいる敵それぞれについて、その能力値ー7（敵の次回行動終了まで）
        FOR_EACH_STAT_INDEX_NODE(
            FOR_EACH_UNIT_NODE(
                SKILL_OWNERS_FOES_HAVE_HIGHEST_AND_THOSE_ALLIES_WITHIN_N_SPACES_ON_MAP(2,
                    TARGETS_EVAL_STAT_ON_MAP(READ_NUM_NODE)),
                INFLICTS_STATS_MINUS_AT_START_OF_TURN_NODE(STATS_FROM_STAT_NODE(7, READ_NUM_NODE)),
            ),
        ),
        // ターン開始時、敵軍内で最も攻撃、速さ、守備、魔防が高い敵それぞれについて、【混乱】、【パニック】を付与（敵の次回行動終了まで）
        FOR_EACH_STAT_INDEX_NODE(
            FOR_EACH_UNIT_NODE(SKILL_OWNERS_FOES_HAVE_HIGHEST_VALUE_ON_MAP(TARGETS_EVAL_STAT_ON_MAP(READ_NUM_NODE)),
                INFLICTS_STATUS_EFFECTS_AT_START_OF_TURN_NODE(StatusEffectType.Sabotage, StatusEffectType.Panic),
            ),
        ),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // 戦闘中、敵の攻撃、速さ、魔防-5、さらに、
        INFLICTS_STATS_MINUS_ON_FOE_DURING_COMBAT_NODE(5, 5, 0, 5),
        X_NUM_NODE(
            // 敵の速さ、魔防が減少
            INFLICTS_STATS_MINUS_ON_FOE_DURING_COMBAT_NODE(0, READ_NUM_NODE, 0, READ_NUM_NODE),
            // 減少値は、敵とその周囲2マス以内にいる敵のうち弱化の合計値が最も高い値、
            highestTotalPenaltiesAmongTargetAndFoesWithinNSpacesOfTarget(2),
        ),
        // 自分が受けた攻撃のダメージを30%軽減（範囲奥義を除く）、
        new ReducesDamageFromTargetsFoesAttacksByXPercentDuringCombatNode(30),
        // 自身の奥義発動カウント変動量ーを無効
        NEUTRALIZES_EFFECTS_THAT_INFLICT_SPECIAL_COOLDOWN_CHARGE_MINUS_X_ON_UNIT,
    ));
}

{
    let skillId = Weapon.SnakingBowPlus;
    // Effective against flying foes.
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit initiates combat or is within 2 spaces of an ally,
        IF_UNIT_INITIATES_COMBAT_OR_IS_WITHIN_2_SPACES_OF_AN_ALLY(
            // grants Atk/Spd/Def/Res+5 to unit,
            GRANTS_ALL_STATS_PLUS_5_TO_UNIT_DURING_COMBAT_NODE,
            // and deals damage= 10% of unit's Atk during combat (excluding area-of-effect Specials),
            UNIT_DEALS_DAMAGE_EXCLUDING_AOE_SPECIALS_NODE(PERCENTAGE_NODE(10, UNITS_ATK_DURING_COMBAT_NODE)),
            // and also,
            // when unit's Special triggers, neutralizes foe's "reduces damage by X%" effects from foe's non-Special skills (excluding area-of-effect Specials).
            WHEN_SPECIAL_TRIGGERS_NEUTRALIZES_FOES_REDUCES_DAMAGE_BY_PERCENTAGE_EFFECTS_FROM_FOES_NON_SPECIAL_EXCLUDING_AOE_SPECIALS_NODE,
        ),
    ));
}

// 比翼ヘイズルーン
{
    let skillId = Hero.DuoHeidrun;
    WHEN_TRIGGERS_DUO_OR_HARMONIZED_EFFECT_HOOKS_MAP.addValue(skillId,
        new SkillEffectNode(
            // Grants Special cooldown count-1 to unit and allies within 3 rows or 3 columns centered on unit.
            FOR_EACH_UNIT_NODE(
                FILTER_UNITS_NODE(TARGET_AND_TARGETS_ALLIES_ON_MAP_NODE,
                    IS_TARGET_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_SKILL_OWNER_NODE),
                new GrantsSpecialCooldownCountMinusOnTargetOnMapNode(1),
            ),
            // Applies【Divine Vein (Green)】on spaces within 3 rows or 3 columns centered on unit for 2 turns.
            FOR_EACH_SPACES_NODE(
                SPACES_ON_MAP_NODE(IS_SPACE_WITHIN_N_ROWS_OR_M_COLUMNS_CENTERED_ON_TARGET_NODE(3, 3)),
                new ApplyDivineVeinNode(DivineVeinType.Green, TARGET_GROUP_NODE, 2),
            ),
        ),
    );
}

// 神獣の蜜・魔道
{
    let skillId = PassiveC.NectarsMagic;
    // At start of player phase or enemy phase,
    let nodeFunc = () => new SkillEffectNode(
        // if unit is within 2 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_2_SPACES_OF_TARGETS_ALLY_NODE,
            // grants 【Divine Nectar】
            // to unit and allies within 2 spaces of unit for 1 turn.
            FOR_EACH_TARGET_AND_TARGETS_ALLY_WITHIN_2_SPACES_OF_TARGET_NODE(
                GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.DivineNectar),
            ),
        ),
    );
    AT_START_OF_TURN_HOOKS.addSkill(skillId, nodeFunc);
    AT_START_OF_ENEMY_PHASE_HOOKS.addSkill(skillId, nodeFunc);

    // If a Rally or movement Assist skill (like Reposition, Shove, Pivot, etc.) is used by an ally with the【Divine Nectar】effect active (excluding unit), grants another action to that ally (once per turn; if another effect that grants action to ally has been activated at the same time, this effect is also considered to have been triggered).
    setDivineNectarAnotherActionSkill(skillId);

    // If unit initiates combat and unit has an area-of-effect Special equipped, grants Special cooldown count-1 to unit before Special triggers before combat.
    BEFORE_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        IF_NODE(AND_NODE(DOES_UNIT_INITIATE_COMBAT_NODE, HAS_TARGET_AOE_SPECIAL_NODE),
            new GrantsSpecialCooldownCountMinusNToTargetBeforeSpecialTriggersBeforeCombatNode(1),
        ),
    ))
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit initiates combat or is within 2 spaces of an ally,
        IF_UNIT_INITIATES_COMBAT_OR_IS_WITHIN_2_SPACES_OF_AN_ALLY(
            // grants Atk/Def/Res+5 to unit during combat,
            GRANTS_ALL_STATS_PLUS_N_TO_UNIT_DURING_COMBAT_NODE(5, 0, 5, 5),
            // and also,
            // if unit's attack can trigger unit's Special (excluding area-of-effect Specials),
            // grants Special cooldown count-1 to unit before unit's first attack during combat.
            IF_NODE(CAN_UNITS_ATTACK_TRIGGER_SPECIAL_NODE,
                GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_N_TO_TARGET_BEFORE_TARGETS_FIRST_ATTACK_DURING_COMBAT_NODE(1),
            ),
        ),
    ));
}

// 新年の双神獣の祭器
{
    let skillId = Weapon.NewYearTreats;
    // Accelerates Special trigger (cooldown count-1).

    // If a Rally or movement Assist skill (like Reposition, Shove, Pivot, etc.) is used by an ally with the【Divine Nectar】effect active (excluding unit),
    let nodeFunc = () => new SkillEffectNode(
        IF_NODE(AND_NODE(
                new HasAssistTargetingStatusEffectNode(StatusEffectType.DivineNectar),
                ARE_SKILL_OWNER_AND_ASSIST_TARGETING_IN_SAME_GROUP_NODE
            ),
            new TargetsOncePerTurnSkillEffectNode(`${skillId}-奥義カウント-1`,
                // to unit and that ally (once per turn).
                FOR_EACH_UNIT_NODE(UnitsNode.makeFromUnits(TARGET_NODE, ASSIST_TARGETING_NODE),
                    // grants Atk/Res+6 and 【Charge】to unit and that ally for 1 turn and grants Special cooldown count-1
                    GRANTS_STATS_PLUS_TO_TARGET_ON_MAP_NODE(0, 0, 6, 6),
                    GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.Charge),
                    new GrantsSpecialCooldownCountMinusOnTargetOnMapNode(1),
                ),
            ),
        ),
    );
    AFTER_RALLY_ENDED_BY_OTHER_UNIT_HOOKS.addSkill(skillId, nodeFunc);
    AFTER_MOVEMENT_ASSIST_ENDED_BY_OTHER_UNIT_HOOKS.addSkill(skillId, nodeFunc);

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of combat,
        // if unit's HP ≥ 25%,
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE(
            X_NUM_NODE(
                // grants bonus to unit's Atk/Def/Res = 20% of unit's Res at start of combat + 5,
                GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE(READ_NUM_NODE, 0, READ_NUM_NODE, READ_NUM_NODE),
                ADD_NODE(PERCENTAGE_NODE(20, UNITS_RES_AT_START_OF_COMBAT_NODE), 5),
            ),
            // deals damage = 20% of unit's Res (including when dealing damage with an area-of-effect Special),
            DEALS_DAMAGE_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS(20, UNITS_RES_DURING_COMBAT_NODE),
            // neutralizes effects that inflict "Special cooldown charge -X" on unit,
            NEUTRALIZES_EFFECTS_THAT_INFLICT_SPECIAL_COOLDOWN_CHARGE_MINUS_X_ON_UNIT,
            // and reduces the percentage of foe's non-Special "reduce damage by X%" skills by 50% during combat (excluding area-of-effect Specials).
            REDUCES_PERCENTAGE_OF_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE,
        ),
    ));
    // deals damage = 20% of unit's Res (including when dealing damage with an area-of-effect Special),
    BEFORE_AOE_SPECIAL_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE(
            UNIT_DEALS_DAMAGE_AT_AOE(PERCENTAGE_NODE(20, UNITS_RES_AT_START_OF_COMBAT_NODE)),
        ),
    ));
}

// 縄張り・護り手・遠
{
    let skillId = PassiveC.HigherGround;
    // If foe with Range = 2 initiates combat against an ally within 2 spaces of unit, triggers 【Savior】on unit.
    setSaveSkill(skillId, false);
    UNIT_CANNOT_WARP_INTO_SPACES_HOOKS.addSkill(skillId, () =>
        OR_NODE(
            // Foes with Range = 1 cannot warp into spaces within 3 spaces of unit and
            AND_NODE(new IsTargetMeleeWeaponNode(), IS_SPACE_WITHIN_3_SPACES_OF_SKILL_OWNER_NODE),
            // foes with Range = 2 cannot warp into spaces within 4 spaces of unit
            AND_NODE(new IsTargetRangedWeaponNode(), IS_SPACE_WITHIN_4_SPACES_OF_SKILL_OWNER_NODE),
            // (in either case, does not affect foes with Pass skills or warp effects from structures, like camps and fortresses in Rival Domains).
        ),
    );
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If foe's Range = 2,
        IF_NODE(FOES_RANGE_IS_2_NODE,
            // grants Def/Res+4 to unit during combat.
            GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE(0, 0, 4, 4),
        ),
    ));
}

// 巳年の毒の牙
{
    let skillId = Weapon.NewYearFang;
    // Accelerates Special trigger (cooldown count-1).

    // At start of player phase or enemy phase,
    let nodeFunc = () => new SkillEffectNode(
        // if unit is within 2 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_N_SPACES_OF_TARGETS_ALLY_NODE(2),
            // to unit and allies within 2 spaces of unit for 1 turn.
            FOR_EACH_TARGET_AND_TARGETS_ALLY_WITHIN_2_SPACES_OF_TARGET_NODE(
                // grants Def/Res+6,【Hexblade】,
                // and "reduces the percentage of foe's non-Special 'reduce damage by X%' skills by 50% during combat (excluding area-of-effect Specials)"
                GRANTS_STATS_PLUS_AT_START_OF_TURN_NODE(0, 0, 6, 6),
                INFLICTS_STATUS_EFFECTS_AT_START_OF_TURN_NODE(
                    StatusEffectType.Hexblade,
                    StatusEffectType.ReducesPercentageOfFoesNonSpecialReduceDamageSkillsBy50Percent
                ),
            ),
        )
    );
    AT_START_OF_TURN_HOOKS.addSkill(skillId, nodeFunc);
    AT_START_OF_ENEMY_PHASE_HOOKS.addSkill(skillId, nodeFunc);

    AFTER_FOLLOW_UP_CONFIGURED_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit is transformed or unit's HP ≥ 25% at start of combat,
        IF_NODE(OR_NODE(IS_TARGET_TRANSFORMED_NODE, IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE),
            IF_NODE(TARGET_CAN_ATTACK_DURING_COMBAT_NODE,
                // deals damage to foe = 25% of foe's max HP as combat begins
                // (activates only when unit can attack in combat; only highest value applied; does not stack with other "deals X damage as combat begins" effects; effects that reduce damage during combat do not apply; will not reduce foe's HP below 1; excluding certain foes, such as Røkkr).
                new DealsDamageToFoeAsCombatBeginsThatDoesNotStackNode(PERCENTAGE_NODE(25, new FoesMaxHpNode())),
            ),
            // (activates only when unit can attack in combat;
            // only highest value applied;
            // does not stack with other "deals X damage as combat begins" effects;
            // effects that reduce damage during combat do not apply;
            // will not reduce foe's HP below 1; excluding certain foes, such as Røkkr).
        ),
    ));

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit is transformed or unit's HP ≥ 25% at start of combat,
        IF_NODE(OR_NODE(IS_TARGET_TRANSFORMED_NODE, IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE),
            X_NUM_NODE(
                // inflicts penalty on foe's Atk/Def = 6 + 20% of unit's Def at start of combat,
                INFLICTS_STATS_MINUS_ON_FOE_DURING_COMBAT_NODE(READ_NUM_NODE, 0, READ_NUM_NODE, 0),
                ADD_NODE(6, PERCENTAGE_NODE(20, UNITS_DEF_AT_START_OF_COMBAT_NODE)),
            ),
            // any "reduces damage by X%" effect that can be triggered only once per combat by unit's equipped Special skill can be triggered up to twice per combat
            new AnyTargetsReduceDamageEffectOnlyOnceCanBeTriggeredUpToNTimesPerCombatNode(1),
            // (excludes boosted Special effects from engaging; only highest value applied; does not stack),

            // deals damage = 30% of foe's max HP (excluding area-of-effect Specials; excluding certain foes, such as Røkkr),
            UNIT_DEALS_DAMAGE_EXCLUDING_AOE_SPECIALS_NODE(PERCENTAGE_NODE(30, new FoesMaxHpNode())),
        ),
    ));

    AT_START_OF_ATTACK_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit is transformed or unit's HP ≥ 25% at start of combat,
        IF_NODE(OR_NODE(IS_TARGET_TRANSFORMED_NODE, IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE),
            X_NUM_NODE(
                // and reduces damage from foe's attacks by X during combat (excluding area-of-effect Specials),
                REDUCES_DAMAGE_FROM_TARGETS_FOES_ATTACKS_BY_X_DURING_COMBAT_PER_ATTACK_NODE(READ_NUM_NODE),
                // and also,
                // when foe's attack triggers foe's Special,
                // reduces damage from foe's attacks by an additional X
                REDUCES_DAMAGE_WHEN_FOES_SPECIAL_EXCLUDING_AOE_SPECIAL_PER_ATTACK_NODE(READ_NUM_NODE),
                // (excluding area-of-effect Specials; X = total damage dealt to foe; min 10; max 20).
                ENSURE_MIN_MAX_NODE(TOTAL_DAMAGE_DEALT_TO_FOE_DURING_COMBAT_NODE, 10, 20),
            )
        ),
    ));

    // At start of turn,
    // if unit is adjacent to only beast or dragon allies or if unit is not adjacent to any ally,
    // unit transforms (otherwise,
    // unit reverts). If unit transforms,
    // grants Atk+2,
    // and unit can counterattack regardless of foe's range.
    setBeastSkill(skillId, BeastCommonSkillType.Armor);
}

// 獣影・強襲
{
    let skillId = PassiveB.BestialAssault;
    // Enables【Canto (Rem. +1; Min ２)】while transformed.
    enablesCantoRemPlusMin(skillId, 1, 2);
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit is transformed or unit's HP ≥ 25% at start of combat,
        IF_NODE(OR_NODE(IS_TARGET_TRANSFORMED_NODE, IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE),
            // inflicts Spd/Def-4 on foe,
            INFLICTS_STATS_MINUS_ON_FOE_DURING_COMBAT_NODE(0, 4, 4, 0),
            // deals damage = 20% of the greater of unit's Spd or Def (excluding area-of-effect Specials),
            DEALS_DAMAGE_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS(20,
                MAX_NODE(UNITS_SPD_DURING_COMBAT_NODE, UNITS_DEF_DURING_COMBAT_NODE)),
            // and reduces the percentage of foe's non-Special "reduce damage by X%" skills by 50% during combat (excluding area-of-effect Specials).
            REDUCES_PERCENTAGE_OF_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE,
        ),
    ));
}

// 新年開く刃の爪
{
    let skillId = Weapon.NewYearTalon;
    // Accelerates Special trigger (cooldown count-1).

    // At start of player phase or enemy phase,
    let nodeFunc = () => new SkillEffectNode(
        // on foes that are within 2 spaces of another foe through their next actions.
        FOR_EACH_UNIT_NODE(TARGETS_FOES_THAT_ARE_WITHIN_N_SPACES_OF_ANOTHER_TARGETS_FOE_NODE(2),
            // inflicts Spd/Def-7,【Exposure】, and 【Sabotage】
            INFLICTS_STATS_MINUS_AT_START_OF_TURN_NODE(0, 7, 7, 0),
            INFLICTS_STATUS_EFFECTS_AT_START_OF_TURN_NODE(StatusEffectType.Exposure, StatusEffectType.Sabotage),
        ),
    );
    AT_START_OF_TURN_HOOKS.addSkill(skillId, nodeFunc);
    AT_START_OF_ENEMY_PHASE_HOOKS.addSkill(skillId, nodeFunc);
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit is transformed or if foe's HP ≥ 75% at start of combat,
        IF_NODE(OR_NODE(IS_TARGET_TRANSFORMED_NODE, IS_FOES_HP_GTE_75_PERCENT_AT_START_OF_COMBAT_NODE),
            // grants bonus to unit's Atk/Spd/Def/Res = 15% of unit's Spd at start of combat + 5,
            GRANTS_ALL_STATS_PLUS_N_TO_UNIT_DURING_COMBAT_NODE(
                ADD_NODE(PERCENTAGE_NODE(15, UNITS_SPD_AT_START_OF_COMBAT_NODE), 5),
            ),
            // unit deals +X damage
            // (X = number of Bonus effects, excluding stat bonuses,
            // and number of Penalty effects, excluding stat penalties,
            // active on foe and foes within 2 spaces of that foe × 3; excluding area-of-effect Specials),
            UNIT_DEALS_DAMAGE_EXCLUDING_AOE_SPECIALS_NODE(
                MULT_NODE(totalNumberOfBonusesAndPenaltiesActiveOnFoeAndAnyFoeWithinNSpacesOfFoe(2), 3),
            ),

            // reduces damage from foe's first attack by 7 ("first attack" normally means only the first strike; for effects that grant "unit attacks twice," it means the first and second strikes),
            REDUCES_DAMAGE_FROM_FOES_FIRST_ATTACK_BY_N_DURING_COMBAT_INCLUDING_TWICE_NODE(7),
            // and grants Special cooldown count-1 to unit before unit's first attack during combat.
            GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_N_TO_TARGET_BEFORE_TARGETS_FIRST_ATTACK_DURING_COMBAT_NODE(1),
        ),
    ));

    // At start of turn,
    // if unit is adjacent to only beast or dragon allies or if unit is not adjacent to any ally,
    // unit transforms (otherwise, unit reverts). If unit transforms,
    // unit can move 1 extra space (that turn only; does not stack) and grants Atk+2 to unit.
    setBeastSkill(skillId, BeastCommonSkillType.Flying);
}

// 天届く翼
{
    let skillId = PassiveB.HeavenlyWings;
    // Enables【Canto (Dist. +1; Max ４)】.
    enablesCantoDist(skillId, 1, 4);
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of combat,
        // if unit's HP ≥ 25%,
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE(
            X_NUM_NODE(
                // inflicts penalty to foe's Atk/Spd/Def = 5 + number of spaces from start position to end position of whoever initiated combat × 3 (max 14),
                INFLICTS_STATS_MINUS_ON_FOE_DURING_COMBAT_NODE(READ_NUM_NODE, READ_NUM_NODE, READ_NUM_NODE, 0),
                ENSURE_MAX_NODE(
                    ADD_NODE(
                        5,
                        MULT_NODE(NUMBER_OF_SPACES_FROM_START_POSITION_TO_END_POSITION_OF_WHOEVER_INITIATED_COMBAT, 3)),
                    14,
                )
            ),
            // neutralizes effects that guarantee foe's follow-up attacks and effects that prevent unit's follow-up attacks,
            NULL_UNIT_FOLLOW_UP_NODE,
            // grants Special cooldown charge +1 to unit per attack (only highest value applied; does not stack),
            GRANTS_SPECIAL_COOLDOWN_CHARGE_PLUS_1_TO_UNIT_PER_ATTACK_DURING_COMBAT_NODE,
            // and grants Special cooldown count-1 to unit before unit's first attack during combat.
            new GrantsSpecialCooldownCountMinusNToTargetBeforeTargetsFirstAttackDuringCombatNode(1),
        ),
    ));
}

// 巳年の神蛇の剣
{
    let skillId = Weapon.SnakingSword;
    // Accelerates Special trigger (cooldown count-1).

    // Allies within 2 spaces of unit can move to any space within 2 spaces of unit.
    setSkillThatAlliesWithinNSpacesOfUnitCanMoveToAnySpaceWithinMSpacesOfUnit(skillId, 2, 2);

    // If unit has entered combat or used an Assist skill during the current turn,
    // allies can move to a space within 2 spaces of unit.
    ALLY_CAN_MOVE_TO_A_SPACE_HOOKS.addSkill(skillId, () =>
        UNITE_SPACES_IF_NODE(
            OR_NODE(
                HAS_SKILL_OWNER_ENTERED_COMBAT_DURING_CURRENT_TURN_NODE,
                HAS_SKILL_OWNER_USED_ASSIST_DURING_CURRENT_TURN_NODE
            ),
            new TargetsPlacableSpacesWithinNSpacesFromSpaceNode(2, SKILL_OWNERS_PLACED_SPACE_NODE),
        ),
    );

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit initiates combat or is within 2 spaces of an ally,
        IF_UNIT_INITIATES_COMBAT_OR_IS_WITHIN_2_SPACES_OF_AN_ALLY(
            // grants bonus to unit's Atk/Spd/Def/Res =
            // number of allies within 3 rows or 3 columns centered on unit × 3, + 5 (max 14),
            GRANTS_ALL_STATS_PLUS_N_TO_UNIT_DURING_COMBAT_NODE(
                ENSURE_MAX_NODE(
                    ADD_NODE(MULT_NODE(NUM_OF_ALLIES_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_UNIT_NODE, 3), 5),
                    14,
                ),
            ),
            // deals damage = 20% of unit's Spd (excluding area-of-effect Specials),
            DEALS_DAMAGE_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS(20, UNITS_SPD_DURING_COMBAT_NODE),
            // and reduces damage from foe's first attack by 20% of unit's Spd during combat ("first attack" normally means only the first strike; for effects that grant "unit attacks twice," it means the first and second strikes).
            REDUCES_DAMAGE_FROM_FOES_FIRST_ATTACK_BY_PERCENTAGE_OF_TARGETS_STAT_DURING_COMBAT_INCLUDING_TWICE_NODE(
                20, UNITS_SPD_DURING_COMBAT_NODE),
        ),
    ));
}
