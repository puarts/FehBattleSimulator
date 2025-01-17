// スキル実装
// TODO: 攻撃魔防の秘奥聖印
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
            IF_NODE(NOT_NODE(IS_SAVIOR_TRIGGERED_NODE),
                // (If support partner is on player team, targets any support partner;
                // otherwise, targets ally with the highest max HP on player team, excluding unit.)
                // that ally attacks twice during their combat.
                COND_OP(IS_THERE_SKILL_OWNERS_PARTNER_ON_MAP_NODE,
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
        INCREASES_SPD_DIFF_NECESSARY_FOR_FOES_FOLLOW_UP_NODE(10),
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
            FOR_EACH_CLOSEST_FOE_AND_ANY_FOE_WITHIN2_SPACES_OF_THOSE_FOES_NODE(
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
            FOR_EACH_CLOSEST_FOE_AND_ANY_FOE_WITHIN2_SPACES_OF_THOSE_FOES_NODE(
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
            CAN_TARGET_ACTIVATE_NON_SPECIAL_MIRACLE_NODE(0),
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
            FOR_EACH_CLOSEST_FOE_AND_ANY_FOE_WITHIN2_SPACES_OF_THOSE_FOES_NODE(
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
            X_NUM_NODE(
                // and reduces damage from foe's attacks by X during combat (excluding area-of-effect Specials),
                REDUCES_DAMAGE_FROM_TARGETS_FOES_ATTACKS_BY_X_DURING_COMBAT_NODE(READ_NUM_NODE),
                // and also,
                // when foe's attack triggers foe's Special,
                // reduces damage from foe's attacks by an additional X
                REDUCES_DAMAGE_WHEN_FOES_SPECIAL_EXCLUDING_AOE_SPECIAL_NODE(READ_NUM_NODE),
                // (excluding area-of-effect Specials; X = total damage dealt to foe; min 10; max 20).
                ENSURE_MIN_MAX_NODE(TOTAL_DAMAGE_DEALT_TO_FOE_DURING_COMBAT_NODE, 10, 20),
            ),
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
    enablesCantoRemPlus(skillId, 1, 2);
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
