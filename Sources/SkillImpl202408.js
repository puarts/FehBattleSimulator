// noinspection JSUnusedLocalSymbols
// 速さの吸収4
{
    let skillId = PassiveB.Speedtaker4;
    // (This skill grants max of【Great Talent】+20.)
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of turn, grants Spd【Great Talent】+1 to unit.
        new GrantsGreatTalentsPlusToTargetNode(
            StatsNode.makeStatsNodeFrom(0, 1, 0, 0),
            StatsNode.makeStatsNodeFrom(20, 20, 20, 20),
        ),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // Inflicts Spd/Def-4 on foe,
        new InflictsStatsMinusOnFoeDuringCombatNode(0, 4, 4, 0),
        // unit deals damage = 20% of unit's Spd (excluding area-of-effect Specials),
        DEALS_DAMAGE_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS(20, UNITS_SPD_DURING_COMBAT_NODE),
        // neutralizes unit's penalties to Spd,
        new NeutralizesPenaltiesToTargetsStatsNode(false, true, false, false),
        // and neutralizes effects that inflict "Special cooldown charge -X" on unit during combat.
        NEUTRALIZES_EFFECTS_THAT_INFLICT_SPECIAL_COOLDOWN_CHARGE_MINUS_X_ON_UNIT,
    ));
    AFTER_COMBAT_IF_UNIT_ATTACKED_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // After combat, if unit attacked, grants Spd【Great Talent】+4 to unit.
        new GrantsGreatTalentsPlusToTargetNode(
            StatsNode.makeStatsNodeFrom(0, 4, 0, 0),
            StatsNode.makeStatsNodeFrom(20, 20, 20, 20),
        ),
    ));
}

// 初撃の鼓動
{
    let skillId = getStatusEffectSkillId(StatusEffectType.PreemptPulse);
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // Grants Special cooldown count-1 to unit before unit's first attack during combat.
        new GrantsSpecialCooldownCountMinusNToTargetBeforeTargetsFirstAttackDuringCombatNode(1),
    ));
}

// 草原の公女の弓
{
    let skillId = Weapon.LadysBow;
    // Accelerates Special trigger (cooldown count-1).
    // Effective against flying foes.

    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of turn,
        // if unit is within 2 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_2_SPACES_OF_TARGETS_ALLY_NODE,
            // to unit and allies within 2 spaces of unit for 1 turn.
            new ForEachTargetAndTargetsAllyWithin2SpacesOfTargetNode(TRUE_NODE,
                // grants Atk/Spd+6,
                new GrantsStatsPlusAtStartOfTurnNode(6, 6, 0, 0),
                // 【Desperation】,
                // and 【Preempt Pulse】
                new GrantsStatusEffectsAtStartOfTurnNode(StatusEffectType.Desperation, StatusEffectType.PreemptPulse),
            ),
        ),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit is within 3 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_TARGETS_ALLY_NODE,
            // grants bonus to unit's Atk/Spd = 6 + 20% of unit's Spd at start of combat,
            X_NUM_NODE(
                new GrantsStatsPlusToTargetDuringCombatNode(READ_NUM_NODE, READ_NUM_NODE, 0, 0),
                ADD_NODE(6, PERCENTAGE_NODE(20, UNITS_SPD_AT_START_OF_COMBAT_NODE)),
            ),
            // deals +7 damage (excluding area-of-effect Specials),
            new TargetDealsDamageExcludingAoeSpecialsNode(7),
            // and reduces the percentage of foe's non-Special "reduce damage by X%" skills by 50% during combat (excluding area-of-effect Specials),
            REDUCES_PERCENTAGE_OF_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE,
            // and also,
            // if decreasing the Spd difference necessary to make a follow-up attack by 25 would allow unit to trigger a follow-up attack (excluding guaranteed or prevented follow-ups),
            // triggers【Potent Follow X%】 during combat (if unit cannot perform follow-up and attack twice,
            // X = 80; otherwise, X = 40).
            APPLY_POTENT_EFFECT_NODE,
        ),
    ));
}

// 流星群
{
    let skillId = Special.AstraStorm;
    NORMAL_ATTACK_SPECIAL_SET.add(skillId);
    setSpecialCount(2);

    // Boosts damage by 40% of unit's Spd when Special triggers.
    WHEN_APPLIES_SPECIAL_EFFECTS_AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        new BoostsDamageWhenSpecialTriggersNode(
            MULT_TRUNC_NODE(0.4, UNITS_SPD_DURING_COMBAT_NODE),
        ),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        TARGET_APPLIES_SKILL_EFFECTS_PER_ATTACK_NODE(
            // If unit's Special is ready or has triggered during this combat,
            IF_NODE(IF_TARGETS_SPECIAL_IS_READY_OR_HAS_TRIGGERED_DURING_COMBAT_NODE,
                // 【Potent Follow X%】 has triggered, and X ≤ 99, then X = 100.
                POTENT_FOLLOW_X_PERCENTAGE_HAS_TRIGGERED_AND_X_LTE_99_THEN_X_IS_N_NODE(100),
            ),
        ),
    ));

    // Unit can use the following【Style】:
    SKILL_ID_TO_STYLE_TYPE.set(skillId, STYLE_TYPE.ASTRA_STORM);
}

{
    let style = STYLE_TYPE.ASTRA_STORM;
    let skillId = getStyleSkillId(style);
    CAN_ACTIVATE_STYLE_HOOKS.addSkill(skillId, () => TRUE_NODE);
    // ――――― Astra Storm Style ―――――
    // Unit can attack foes within 6 spaces of unit and 3 rows or 3 columns centered on unit regardless of unit's range.
    CANNOT_MOVE_STYLE_ATTACK_RANGE_HOOKS.addSkill(skillId, () =>
        SPACES_OF_TARGET_NODE(AND_NODE(
            IS_SPACE_WITHIN_N_SPACES_OF_TARGET_NODE(6),
            IS_SPACE_WITHIN_N_ROWS_OR_M_COLUMNS_CENTERED_ON_TARGET_NODE(3, 3))
        ),
    );

    // Unit suffers a counterattack if any of the following conditions are met:
    SUFFERS_COUNTERATTACK_DURING_STYLE_HOOKS.addSkill(skillId, () =>
        OR_NODE(
            // foe is armored with Range = 2,
            AND_NODE(IS_FOE_ARMOR_NODE, FOES_RANGE_IS_2_NODE),
            // foe can counterattack regardless of unit's range,
            CAN_FOE_COUNTERATTACK_REGARDLESS_OF_RANGE_NODE,
            // or foe's Range is the same as the distance between unit and foe.
            EQ_NODE(FOES_RANGE_NODE, DISTANCE_BETWEEN_TARGET_AND_TARGETS_FOE_NODE),
        ),
    );
    // Unit cannot move
    CANNOT_MOVE_STYLES.add(style);
    // or attack structures,
    CANNOT_ATTACK_STRUCTURE_STYLES.add(style);
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        IF_NODE(IS_STYLE_ACTIVE(style),
            // After-combat movement effects do not occur.
            AFTER_COMBAT_MOVEMENT_EFFECTS_DO_NOT_OCCUR_BECAUSE_OF_TARGET_NODE,
        ),
    ));
    // TODO: 実装する
    // and remaining movement granted from Canto is treated as 0.

    // Skill effect's Range is treated as 2,
    // including by skill effects determined by attack Range, like Pavise and Aegis.
    STYLES_THAT_SKILLS_EFFECTS_RANGE_IS_TREATED_AS_2.add(style);
    // This Style can be used only once per turn.
    STYLES_THAT_CAN_BE_USED_ONLY_ONCE_PER_TURN.add(style);
    // ――――――――――――――――――――
}

// 紋章士リン
{
    let style = STYLE_TYPE.EMBLEM_LYN;
    let skillId = getEmblemHeroSkillId(EmblemHero.Lyn);
    SKILL_ID_TO_STYLE_TYPE.set(skillId, style);
    CAN_ACTIVATE_STYLE_HOOKS.addSkill(skillId, () =>
        AND_NODE(
            GTE_NODE(CURRENT_TURN_NODE, 2),
            EQ_NODE(TARGET_REST_STYLE_SKILL_AVAILABLE_TURN_NODE, 0),
            IS_TARGET_RANGED_WEAPON_NODE),
    );
    STYLE_ACTIVATED_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        SET_TARGET_REST_STYLE_SKILL_AVAILABLE_TURN_NODE(2),
    ));
    SUFFERS_COUNTERATTACK_DURING_STYLE_HOOKS.addSkill(skillId, () =>
        OR_NODE(
            // foe is armored with Range = 2,
            AND_NODE(IS_FOE_ARMOR_NODE, FOES_RANGE_IS_2_NODE),
            // foe can counterattack regardless of unit's range,
            CAN_FOE_COUNTERATTACK_REGARDLESS_OF_RANGE_NODE,
            // or foe's Range is the same as the distance between unit and foe.
            EQ_NODE(FOES_RANGE_NODE, DISTANCE_BETWEEN_TARGET_AND_TARGETS_FOE_NODE),
        ),
    );
    CANNOT_MOVE_STYLES.add(style);
    CANNOT_ATTACK_STRUCTURE_STYLES.add(style);
    CANNOT_MOVE_STYLE_ATTACK_RANGE_HOOKS.addSkill(skillId, () =>
        SPACES_OF_TARGET_NODE(AND_NODE(
            IS_SPACE_WITHIN_N_SPACES_OF_TARGET_NODE(5),
            IS_SPACE_WITHIN_N_ROWS_OR_M_COLUMNS_CENTERED_ON_TARGET_NODE(3, 3))
        ),
    );

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        new BoostsDamageWhenSpecialTriggersNode(
            MULT_NODE(new TargetsMaxSpecialCountNode(), 4),
        ),
        AFTER_COMBAT_MOVEMENT_EFFECTS_DO_NOT_OCCUR_BECAUSE_OF_TARGET_NODE,
    ));
    BEFORE_AOE_SPECIAL_ACTIVATION_CHECK_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        IF_NODE(IS_STYLE_ACTIVE(style),
            UNIT_CANNOT_TRIGGER_AREA_OF_EFFECT_SPECIALS_NODE,
        ),
    ));
    STYLES_THAT_SKILLS_EFFECTS_RANGE_IS_TREATED_AS_2.add(style);
    STYLES_THAT_CAN_BE_USED_ONLY_ONCE_PER_TURN.add(style);
}

// 比翼リュール
{
    let skillId = Hero.DuoAlear;
    WHEN_TRIGGERS_DUO_OR_HARMONIZED_EFFECT_HOOKS_MAP.addValue(skillId,
        new SkillEffectNode(
            new ForEachTargetAndTargetsAllyWithinNSpacesOfTargetNode(3, TRUE_NODE,
                NEUTRALIZES_ANY_PENALTY_ON_TARGET_NODE,
                new GrantsStatusEffectsOnTargetOnMapNode(
                    StatusEffectType.NeutralizesFoesBonusesDuringCombat,
                    StatusEffectType.ReducesPercentageOfFoesNonSpecialReduceDamageSkillsBy50Percent
                ),
            ),
        ),
    );

    RESET_DUO_OR_HARMONIZED_SKILL_EVERY_3_TURNS_SET.add(skillId);
}

// 神竜の結束
{
    let skillId = getStatusEffectSkillId(StatusEffectType.DivinelyInspiring)
    // 【Divinely Inspiring】
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        X_NUM_NODE(
            // Grants bonus to unit's Atk/Spd/Def/Res = X × 3
            new GrantsAllStatsPlusNToTargetDuringCombatNode(MULT_NODE(READ_NUM_NODE, 3)),
            // grants Special cooldown count-X to unit before foe's first attack,
            new GrantsSpecialCooldownCountMinusNToTargetBeforeTargetsFoesFirstAttackDuringCombatNode(READ_NUM_NODE),
            // and when unit deals damage to foe during combat,
            // restores X × 4 HP to unit during combat.
            new WhenTargetDealsDamageDuringCombatRestoresNHpToTargetNode(MULT_NODE(READ_NUM_NODE, 4)),
            // (X = number of allies with the Divinely Inspiring effect within 3 spaces of unit,
            // excluding unit; max 2),
            ENSURE_MAX_NODE(
                COUNT_IF_UNITS_NODE(
                    TARGETS_ALLIES_WITHIN_N_SPACES_NODE(3),
                    HAS_TARGET_STATUS_EFFECT_NODE(StatusEffectType.DivinelyInspiring),
                ),
                2,
            )
        ),
    ));
}

// 冬の双神竜の体術
{
    let skillId = Weapon.WinteryArts;
    // Accelerates Special trigger (cooldown count-1).
    // Unit attacks twice (even if foe initiates combat, unit attacks twice).
    // If foe's Range = 2,
    // calculates damage using the lower of foe's Def or Res.
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of turn,
        // if unit is within 2 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_2_SPACES_OF_TARGETS_ALLY_NODE,
            new ForEachTargetAndTargetsAllyWithin2SpacesOfTargetNode(TRUE_NODE,
                // grants【Divinely Inspiring】
                new GrantsStatusEffectsAtStartOfTurnNode(StatusEffectType.DivinelyInspiring),
            ),
            // to unit and allies within 2 spaces of unit for 1 turn.
        ),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit is within 3 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_TARGETS_ALLY_NODE,
            // grants Atk/Spd/Def/Res+5 to unit,
            GRANTS_ALL_STATS_PLUS_5_TO_UNIT_DURING_COMBAT_NODE,
            // inflicts penalty on foe's Atk/Spd/Def/Res = number of distinct game titles among allies within 3 spaces of unit × 3 + 4 (max 10),
            INFLICTS_ALL_STATS_MINUS_N_ON_FOE_DURING_COMBAT_NODE(
                ENSURE_MAX_NODE(
                    ADD_NODE(
                        MULT_NODE(NUMBER_OF_DISTINCT_GAME_TITLES_AMONG_ALLIES_WITHIN_N_SPACES_OF_UNIT_NODE(3), 3),
                        4,
                    ),
                    10
                ),
            ),
            X_NUM_NODE(
                // unit deals +X damage
                new UnitDealsDamageExcludingAoeSpecialsNode(READ_NUM_NODE),
                // and reduces damage from foe's first attack by X during combat
                // ("first attack" normally means only the first strike; for effects that grant "unit attacks twice," it means the first and second strikes).
                new ReducesDamageFromFoesFirstAttackByNDuringCombatIncludingTwiceNode(READ_NUM_NODE),
                // (X = 5 × the total of the number of distinct game titles among allies,
                // excluding unit,
                // and the number of engaged allies,
                // excluding unit; max 15; excluding area-of-effect Specials),
                ENSURE_MAX_NODE(
                    MULT_NODE(
                        5,
                        ADD_NODE(
                            TOTAL_OF_THE_NUMBER_OF_DISTINCT_GAME_TITLES_AMONG_UNITS_NODE(
                                TARGETS_ALLIES_WITHOUT_TARGET_ON_MAP_NODE
                            ),
                            COUNT_IF_UNITS_NODE(TARGETS_ALLIES_WITHOUT_TARGET_ON_MAP_NODE, IS_TARGET_ENGAGED_NODE),
                        )
                    ),
                    15
                ),
            ),
        ),
    ));
}

// 光輝く理力
{
    let skillId = PassiveC.TwinklingAnima;
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of turn,
        // if unit's HP ≥ 25%,
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_TURN_NODE(
            new ForEachTargetAndTargetsAllyWithinNSpacesOfTargetNode(3, TRUE_NODE,
                // grants Atk/Spd+6,
                new GrantsStatsPlusAtStartOfTurnNode(6, 6, 0, 0),
                // 【Canto (１)】,
                // and the following status
                // to unit and allies within 3 spaces of unit for 1 turn:
                // "neutralizes penalties on unit during combat."
                new GrantsStatusEffectsAtStartOfTurnNode(StatusEffectType.Canto1, StatusEffectType.NeutralizesPenalties),
            ),
        ),
        // At start of turn,
        // if unit's HP ≥ 25%,
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_TURN_NODE(
            new ForEachTargetsClosestFoeAndAnyFoeWithinNSpacesOfThoseFoesNode(3, TRUE_NODE,
                // inflicts Spd/Res-7,
                new InflictsStatsMinusOnTargetOnMapNode(0, 7, 0, 7),
                // 【Panic】,
                // and【Discord】
                new InflictsStatusEffectsOnTargetOnMapNode(StatusEffectType.Panic, StatusEffectType.Discord),
                // on closest foes and any foe within 3 spaces of those foes through their next actions.
            ),
        ),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit is within 3 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_TARGETS_ALLY_NODE,
            // grants Atk/Spd+5 to unit,
            new GrantsStatsPlusToTargetDuringCombatNode(5, 5, 0, 0),
            // neutralizes effects that inflict "Special cooldown charge -X" on unit,
            NEUTRALIZES_EFFECTS_THAT_INFLICT_SPECIAL_COOLDOWN_CHARGE_MINUS_X_ON_UNIT,
            // and reduces the percentage of foe's non-Special "reduce damage by X%" skills by 50% during combat
            // (excluding area-of-effect Specials).
            REDUCES_PERCENTAGE_OF_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE,
        ),
    ));
}

// アイスロック+
{
    let skillId = Support.IceLockPlus;
    ASSIST_RANGE_MAP.set(skillId, 2);
    // This skill is treated as a Rally Assist skill.
    // Restores HP = 40% of unit's Atk (min: 6 HP) to target ally and grants Def/Res+6 to target ally for 1 turn,
    // and also,
    setRallyHealSkill(skillId, [0, 0, 6, 6], 6, 0.4, [],
        new IsThereNoDivineVeinIceCurrentlyAppliedByTargetOrTargetsAlliesNode());

    AFTER_RALLY_SKILL_IS_USED_BY_UNIT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // if there is no【Divine Vein (Ice)】 currently applied by unit or allies,
        IF_NODE(IS_THERE_NO_DIVINE_VEIN_ICE_CURRENTLY_APPLIED_BY_TARGET_OR_TARGETS_ALLIES_NODE,
            // applies 【Divine Vein (Ice)】to spaces 2 spaces away from target after movement for 1 turn
            new AppliesDivineVeinNode(
                DivineVeinType.Ice,
                AND_NODE(
                    new IsSpacesNSpacesAwayFromAssistedNode(2),
                    // (excludes spaces occupied by a foe,
                    IS_SPACE_OCCUPIED_BY_TARGETS_FOE_NODE,
                    // destructible terrain other than【Divine Vein (Ice)】, and
                    IS_NOT_DESTRUCTIBLE_TERRAIN_OTHER_THAN_DIVINE_VEIN_ICE_NODE,
                    // TODO: ワープができるコンテンツが来たら実装する
                    // warp spaces in Rival Domains).
                ),
            ),
        ),
    ));

    AFTER_RALLY_ENDED_BY_UNIT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If used on turn 2 onward,
        IF_NODE(GTE_NODE(CURRENT_TURN_NODE, 2),
            // also grants another action to unit and inflicts "restricts movement to 1 space" on unit and Pair Up cohort through their next action.
            // (Effects that can trigger on turn 2 onward will not trigger again for 2 turns after triggering;
            // using this skill has no effect on Special cooldown charge and unit does not gain EXP or SP.)
            TARGETS_REST_SUPPORT_SKILL_AVAILABLE_TURN_NODE(2,
                GRANTS_ANOTHER_ACTION_ON_ASSIST_NODE,
                new GrantsStatusEffectsOnTargetOnMapNode(StatusEffectType.Gravity),
            ),
        ),
    ));
}

// 雪だるまの雪杖
{
    let skillId = Weapon.SnowmanStaff;
    // Accelerates Special trigger (cooldown count-1; max cooldown count value cannot be reduced below 1). Foe cannot counterattack.
    // TODO: 修正する
    resetMaxSpecialCountFuncMap.set(skillId,
        function () {
            return -1;
        }
    );
    // Unit can move to a space within 2 spaces of any ally within 2 spaces of unit.
    setSkillThatUnitCanMoveToAnySpaceWithinNSpacesOfAnAllyWithinMSpacesOfUnit(skillId, 2, 2);

    // If a Rally or movement Assist skill is used by unit,
    let nodeFunc = () => new SkillEffectNode(
        new TargetsOncePerTurnSkillEffectNode(`${skillId}-奥義発動カウント-1`,
            new ForEachUnitNode(ALLIES_WITHIN_N_SPACES_OF_BOTH_ASSIST_UNIT_AND_TARGET(3), TRUE_NODE,
                // Special cooldown count-1 to unit,
                new GrantsSpecialCooldownCountMinusOnTargetOnMapNode(1),
            )
        ),
        new ForEachUnitNode(ALLIES_WITHIN_N_SPACES_OF_BOTH_ASSIST_UNIT_AND_TARGET(3), TRUE_NODE,
            // grants【Foe Penalty Doubler】and
            // target ally,
            new GrantsStatusEffectsOnTargetOnMapNode(StatusEffectType.FoePenaltyDoubler),
            // and allies within 3 spaces of target ally after movement (Special cooldown count-1 effect granted only once per turn).
        )
    );
    AFTER_RALLY_SKILL_IS_USED_BY_UNIT_HOOKS.addSkill(skillId, nodeFunc);
    AFTER_MOVEMENT_SKILL_IS_USED_BY_UNIT_HOOKS.addSkill(skillId, nodeFunc);

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit is within 3 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_TARGETS_ALLY_NODE,
            X_NUM_NODE(
                // grants bonus to unit's Atk/Spd = 6 + 20% of unit's Spd at start of combat,
                new GrantsStatsPlusToTargetDuringCombatNode(READ_NUM_NODE, READ_NUM_NODE, 0, 0),
                ADD_NODE(6, PERCENTAGE_NODE(20, UNITS_SPD_AT_START_OF_COMBAT_NODE)),
            ),
            // neutralizes effects that guarantee foe's follow-up attacks and effects that prevent unit's follow-up attacks,
            NULL_UNIT_FOLLOW_UP_NODE,
            // and deals damage = 20% of unit's Spd during combat
            // (excluding area-of-effect Specials; if the "calculates damage from staff like other weapons" effect is not active, damage from staff is calculated after combat damage is added).
            DEALS_DAMAGE_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS(20, UNITS_SPD_DURING_COMBAT_NODE),
        ),
    ));
}

// 罠解除・周到
{
    let skillId = PassiveB.FullDisarm;
    // While attacking in Aether Raids,
    // if unit ends movement on a space with a Bolt Trap or a Heavy Trap, cancels trap's effect;
    // if unit ends movement on a space with a Hex Trap, reduces trap's trigger condition by 10 HP.
    DISARM_TRAP_SKILL_SET.add(skillId);
    DISARM_HEX_TRAP_SKILL_SET.add(skillId);

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        X_NUM_NODE(
            // Inflicts Spd/Def-X on foe
            new InflictsStatsMinusOnFoeDuringCombatNode(0, READ_NUM_NODE, READ_NUM_NODE, 0),
            // (X = total number of【Bonus】effects active on unit, excluding stat bonuses,
            // and【Penalty】effects active on foe, excluding stat penalties,
            // × 2,
            // + 4; max 12),
            new EnsureMaxNode(
                ADD_NODE(MULT_NODE(NUM_OF_BONUS_ON_UNIT_PLUS_NUM_OF_PENALTY_ON_FOE_EXCLUDING_STAT_NODE, 2), 4),
                12,
            ),
        ),
        // and neutralizes effects that inflict "Special cooldown charge -X" on unit during combat.
        NEUTRALIZES_EFFECTS_THAT_INFLICT_SPECIAL_COOLDOWN_CHARGE_MINUS_X_ON_UNIT,
    ));
}

// 真連閃
{
    let skillId = PassiveA.SwiftIce;
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit initiates combat or is within 2 spaces of an ally,
        IF_UNIT_INITIATES_COMBAT_OR_IS_WITHIN_2_SPACES_OF_AN_ALLY(
            // grants Atk/Spd/Def/Res+8 to unit,
            GRANTS_ALL_STATS_PLUS_8_TO_TARGET_DURING_COMBAT_NODE,
            // reduces damage from foe's first attack by 30%
            // ("first attack" normally means only the first strike; for effects that grant "unit attacks twice," it means the first and second strikes),
            new ReducesDamageFromFoesFirstAttackByNPercentDuringCombatIncludingTwiceNode(30),
            // neutralizes effects that guarantee foe's follow-up attacks and effects that prevent unit's follow-up attacks,
            NULL_UNIT_FOLLOW_UP_NODE,
            // and reduces the percentage of foe's non-Special "reduce damage by X%" skills by 50% during combat (excluding area-of-effect Specials).
            REDUCES_PERCENTAGE_OF_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE,

            new AppliesSkillEffectsAfterStatusFixedNode(
                // If unit initiates combat against a non-dragon,
                // non-beast infantry foe and unit's Spd ≥ foe's Spd+20,
                IF_NODE(
                    AND_NODE(
                        DOES_UNIT_INITIATE_COMBAT_NODE,
                        AND_NODE(NOT_NODE(IS_FOE_BEAST_OR_DRAGON_TYPE_NODE), IS_FOE_INFANTRY_NODE),
                        GTE_NODE(UNITS_SPD_DURING_COMBAT_NODE, ADD_NODE(FOES_SPD_DURING_COMBAT_NODE, 20))
                    ),
                    // grants "effective against all weapon types" to unit during combat. Otherwise,
                    GRANTS_EFFECTIVE_AGAINST_ALL_WEAPON_TYPES_TO_UNIT_DURING_COMBAT,
                ),
                // if unit initiates combat and unit's Spd ≥ foe's Spd+5,
                IF_NODE(
                    AND_NODE(
                        DOES_UNIT_INITIATE_COMBAT_NODE,
                        NOT_NODE(AND_NODE(NOT_NODE(IS_FOE_BEAST_OR_DRAGON_TYPE_NODE), IS_FOE_INFANTRY_NODE)),
                        GTE_NODE(UNITS_SPD_DURING_COMBAT_NODE, ADD_NODE(FOES_SPD_DURING_COMBAT_NODE, 5))
                    ),
                    // grants "effective against all weapon types" to unit during combat.
                    GRANTS_EFFECTIVE_AGAINST_ALL_WEAPON_TYPES_TO_UNIT_DURING_COMBAT,
                ),
            ),
        ),
    ));
}

// 冬の修羅の手甲刃
{
    let skillId = Weapon.RedFistBlades;
    // Accelerates Special trigger (cooldown count-1). Unit attacks twice (even if foe initiates combat, unit attacks twice).
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of turn,
        // if unit's HP ≥ 25%,
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_TURN_NODE(
            new ForEachTargetAndTargetsAllyWithin2SpacesOfTargetNode(TRUE_NODE,
                // grants Atk/Spd+6,
                new GrantsStatsPlusAtStartOfTurnNode(6, 6, 0, 0),
                // 【Incited】,
                new GrantsStatusEffectsAtStartOfTurnNode(StatusEffectType.Incited, StatusEffectType.SpecialCooldownChargePlusOnePerAttack),
                // and "Special cooldown charge +1 per attack during combat (only highest value applied; does not stack)" to unit and allies within 2 spaces of unit for 1 turn.
            )
        ),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of combat,
        // if unit's HP ≥ 25%,
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE(
            // grants bonus to unit's Atk/Spd/Def/Res = number of foes within 3 rows or 3 columns centered on unit × 3,
            // + 5 (max 14),
            new GrantsAllStatsPlusNToTargetDuringCombatNode(
                new EnsureMaxNode(
                    ADD_NODE(MULT_NODE(NUM_OF_FOES_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_UNIT_NODE, 3), 5),
                    14,
                ),
            ),
            // deals damage = 20% of unit's Spd (excluding area-of-effect Specials),
            DEALS_DAMAGE_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS(20, UNITS_SPD_DURING_COMBAT_NODE),
            // and reduces damage from foe's first attack by 7 during combat ("first attack" normally means only the first strike; for effects that grant "unit attacks twice," it means the first and second strikes).
            new ReducesDamageFromFoesFirstAttackByNDuringCombatIncludingTwiceNode(7),
        ),
    ));
}

// 鉛色の残夢
{
    let skillId = PassiveA.LeadenRegrets;
    // If unit can transform,
    // transformation effects gain "if unit is within 2 spaces of a beast or dragon ally,
    // or if number of adjacent allies other than beast or dragon allies ≤ 2" as a trigger condition (in addition to existing conditions).
    setEffectThatTransformationEffectsGainAdditionalTriggerCondition(skillId);

    // If defending in Aether Raids,
    // at the start of enemy turn 1,
    // if conditions for transforming are met, unit transforms.
    setEffectThatIfDefendingInARAtStartOfEnemyTurn1UnitTransforms(skillId);

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit is transformed or if foe initiates combat,
        IF_NODE(OR_NODE(IS_TARGET_TRANSFORMED_NODE, DOES_FOE_INITIATE_COMBAT_NODE),
            // inflicts Atk/Def-10 on foe,
            new InflictsStatsMinusOnFoeDuringCombatNode(10, 0, 10, 0),
            // reduces damage from foe's follow-up attack by 80%
            new ReducesDamageFromTargetFoesFollowUpAttackByXPercentDuringCombatNode(80),
            // ("follow-up attack" normally means only the second strike; for effects that grant "unit attacks twice," it means the third and fourth strikes),
            // and reduces the percentage of foe's non-Special "reduce damage by X%" skills by 50% during combat (excluding area-of-effect Specials).
            REDUCES_PERCENTAGE_OF_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE,
        ),
    ));

    AFTER_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If foe initiates combat,
        IF_NODE(DOES_FOE_INITIATE_COMBAT_NODE,
            // after combat,
            // the closest foes within 4 spaces of target who have yet to act have their actions end immediately.
            FOR_EACH_UNIT_NODE(
                FOES_CLOSEST_ALLIES_WITHIN_N_SPACES_NODE(4, FALSE_NODE, NOT_NODE(HAS_TARGET_PERFORMED_ACTION_NODE)),
                ENDS_TARGET_IMMEDIATELY_BY_SKILL_NODE,
            ),
        ),
    ));
}

// 冬氷の魔拳
{
    let skillId = Weapon.IcyRavager;
    // Accelerates Special trigger (cooldown count-1).

    // At start of turn, and at start of enemy phase (except for in Summoner Duels),
    let nodeFunc = () => new SkillEffectNode(
        // if Special cooldown count is at its maximum value,
        IF_NODE(IS_TARGETS_SPECIAL_COOLDOWN_COUNT_AT_ITS_MAX_AT_START_OF_TURN_NODE,
            // grants Special cooldown count-1.
            new GrantsSpecialCooldownCountMinusOnTargetOnMapNode(1),
        ),
    );
    AT_START_OF_TURN_HOOKS.addSkill(skillId, nodeFunc);
    AT_START_OF_ENEMY_PHASE_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        IF_NODE(IS_NOT_SUMMONER_DUELS_MODE_NODE,
            nodeFunc(),
        ),
    ));

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If foe initiates combat or foe's HP ≥ 75% at start of combat,
        IF_FOE_INITIATES_COMBAT_OR_IF_FOES_HP_GTE_75_PERCENT_AT_START_OF_COMBAT(
            // inflicts penalty on foe's Atk/Def = 20% of unit's Def at start of combat + 6,
            X_NUM_NODE(
                new InflictsStatsMinusOnFoeDuringCombatNode(READ_NUM_NODE, 0, READ_NUM_NODE, 0),
                ADD_NODE(PERCENTAGE_NODE(20, UNITS_DEF_AT_START_OF_COMBAT_NODE), 6),
            ),
            X_NUM_NODE(
                // unit deals +X damage
                new UnitDealsDamageExcludingAoeSpecialsNode(READ_NUM_NODE),
                // reduces damage from foe's attacks by X (excluding area-of-effect Specials),
                new ReducesDamageFromTargetsFoesAttacksByXDuringCombatNode(READ_NUM_NODE),

                // (X = total value of the number of foes defeated by unit's team on the current turn
                // and the number of foes that have already performed an action, x 3, + 10; max 19;
                // for "current turn." player phase and enemy phase are counted separately; excluding area-of-effect Specials),
                new EnsureMaxNode(
                    ADD_NODE(
                        MULT_NODE(
                            ADD_NODE(
                                NUM_OF_TARGETS_FOES_DEFEATED_BY_TARGET_TEAM_ON_CURRENT_TURN_NODE,
                                NUM_OF_TARGETS_FOES_THAT_HAVE_ALREADY_PERFORMED_ACTION
                            ),
                            3,
                        ),
                        10,
                    ),
                    19,
                ),
            ),
            // and neutralizes effects that inflict "Special cooldown charge -X" on unit during combat,
            NEUTRALIZES_EFFECTS_THAT_INFLICT_SPECIAL_COOLDOWN_CHARGE_MINUS_X_ON_UNIT,
        )
    ));

    AFTER_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // and also,
        // and if unit's Special cooldown count is at its maximum value after combat,
        // grants Special cooldown count-1 to unit after combat.
        IF_TARGETS_SPECIAL_COOLDOWN_COUNT_IS_AT_ITS_MAXIMUM_VALUE_GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_X_NODE(1),
    ));

    // At start of turn,
    // if unit is adjacent to only beast or dragon allies or if unit is not adjacent to any ally,
    // unit transforms (otherwise, unit reverts).
    // If unit transforms,
    // grants Atk+2,
    // and unit can counterattack regardless of foe's range.
    setBeastSkill(skillId, BeastCommonSkillType.Armor);
}

// 鍛錬の鼓動・謀策
{
    let skillId = PassiveC.PulseUpPloy;
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of turn, grants Special cooldown count-1.
        new GrantsSpecialCooldownCountMinusOnTargetAtStartOfTurnNode(1),
    ));

    // At start of player phase or enemy phase,
    let nodeFunc = () => new SkillEffectNode(
        // if any foes within 3 rows or 3 columns centered on unit have Res < unit's Res+5,
        new ForEachUnitNode(new TargetsFoesOnMapNode(), IS_TARGET_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_SKILL_OWNER_NODE,
            IF_NODE(LT_NODE(TARGETS_EVAL_RES_ON_MAP, ADD_NODE(SKILL_OWNERS_EVAL_RES_ON_MAP, 5)),
                // inflicts【Ploy】 and【Exposure】on those foes through their next actions.
                new InflictsStatusEffectsAtStartOfTurnNode(StatusEffectType.Ploy, StatusEffectType.Exposure),
            ),
        ),
    );
    AT_START_OF_TURN_HOOKS.addSkill(skillId, nodeFunc);
    AT_START_OF_ENEMY_PHASE_HOOKS.addSkill(skillId, nodeFunc);
}

// 知の源
{
    let skillId = PassiveB.FontOfWisdom;
    // At start of player phase or enemy phase,
    let nodeFunc = () => new SkillEffectNode(
        // inflicts Atk/Spd/Res-7 on foes that are within 2 spaces of another foe through their next actions.
        new ForEachUnitNode(TARGETS_FOES_NODE,
            IS_TARGET_WITHIN_2_SPACES_OF_TARGETS_ALLY_NODE,

            new InflictsStatsMinusAtStartOfTurnNode(7, 7, 0, 7),
        ),
    );
    AT_START_OF_TURN_HOOKS.addSkill(skillId, nodeFunc);
    AT_START_OF_ENEMY_PHASE_HOOKS.addSkill(skillId, nodeFunc);

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // Inflicts Atk/Spd/Res-5 on foe,
        new InflictsStatsMinusOnFoeDuringCombatNode(5, 5, 0, 5),
        // inflicts penalty on foe's Atk/Spd/Res = highest penalty on each stat between target and foes within 2 spaces of target
        new InflictsStatsMinusOnFoeDuringCombatNode(
            MULT_STATS_NODE(
                StatsNode.makeStatsNodeFrom(1, 1, 0, 1),
                HIGHEST_PENALTIES_ON_EACH_STAT_BETWEEN_TARGET_AND_TARGET_ALLIES_WITHIN_N_SPACES_NODE(2),
            ),
        ),
        // (calculates each stat penalty independently),
        // deals damage = 20% of unit's Res (excluding area-of-effect Specials),
        DEALS_DAMAGE_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS(20, UNITS_RES_DURING_COMBAT_NODE),
        // reduces the percentage of foe's non-Special "reduce damage by X%" skills by 50% (excluding area-of-effect Specials),
        REDUCES_PERCENTAGE_OF_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE,
        // and reduces damage from foe's first attack by 7 during combat
        // ("first attack" normally means only the first strike; for effects that grant "unit attacks twice," it means the first and second strikes).
        new ReducesDamageFromFoesFirstAttackByNDuringCombatIncludingTwiceNode(7),
    ));
}

// 多感
{
    let skillId = getStatusEffectSkillId(StatusEffectType.Empathy);
    // 【Empathy】
    // Grants bonus to unit's Atk/Spd/Def/Res = number of types of【Bonus】effects,
    // excluding stat bonuses,
    // and【Penalty】effects,
    // excluding stat penalties,
    // active on player team and enemy team during combat (max 7).
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        new GrantsAllStatsPlusNToTargetDuringCombatNode(
            new EnsureMaxNode(
                SET_SIZE_NODE(new MapUnionUnitsNode(
                    UNITS_ON_MAP_NODE,
                    BONUSES_AND_PENALTIES_ACTIVE_ON_TARGET_EXCLUDING_STAT_SET_NODE)
                ),
                7
            ),
        ),
    ));
}

// 創世の文字の力
{
    let skillId = Weapon.OdrOfCreation;
    // Accelerates Special trigger (cooldown count-1).

    // At start of player phase or enemy phase,
    let nodeFunc = () => new SkillEffectNode(
        // if unit is within 2 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_2_SPACES_OF_TARGETS_ALLY_NODE,
            // grants【Empathy】 and "unit can move to a space adjacent to any ally within 2 spaces"
            // to unit and allies within 2 spaces of unit for 1 turn.
            new ForEachTargetAndTargetsAllyWithin2SpacesOfTargetNode(TRUE_NODE,
                new GrantsStatusEffectsAtStartOfTurnNode(StatusEffectType.Empathy, StatusEffectType.AirOrders),
            )
        ),
    );
    AT_START_OF_TURN_HOOKS.addSkill(skillId, nodeFunc);
    AT_START_OF_ENEMY_PHASE_HOOKS.addSkill(skillId, nodeFunc);
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit initiates combat or is within 2 spaces of an ally,
        IF_UNIT_INITIATES_COMBAT_OR_IS_WITHIN_2_SPACES_OF_AN_ALLY(
            // grants bonus to unit's Atk/Spd/Def/Res = number of allies within 3 rows or 3 columns centered on unit × 3, + 5 (max 14),
            new GrantsAllStatsPlusNToTargetDuringCombatNode(
                new EnsureMaxNode(
                    ADD_NODE(MULT_NODE(NUM_OF_ALLIES_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_UNIT_NODE, 3), 5),
                    14,
                ),
            ),
            // neutralizes unit's penalties,
            NEUTRALIZES_PENALTIES_ON_UNIT_NODE,
            X_NUM_NODE(
                // deals +X damage
                new UnitDealsDamageExcludingAoeSpecialsNode(READ_NUM_NODE),
                // (X = number of【Bonus】effects active on unit and foe,
                // excluding stat bonuses, × 5; max 25; excluding area-of-effect Specials),
                new EnsureMaxNode(MULT_NODE(NUM_OF_BONUS_ON_UNIT_AND_FOE_EXCLUDING_STAT_NODE, 5), 25),
            ),
            // and neutralizes effects that inflict "Special cooldown charge -X" on unit during combat.
            NEUTRALIZES_EFFECTS_THAT_INFLICT_SPECIAL_COOLDOWN_CHARGE_MINUS_X_ON_UNIT,
        ),
    ));
}

// オスティアの血盟
{
    let skillId = PassiveA.OathOfOstia;
    // Grants HP+5.

    let applyDivineVeinFunc = () => new SkillEffectNode(
        // applies Divine Vein (Stone) to unit's space and spaces within 2 spaces of unit for 1 turn.
        new ForEachSpacesNode(new SpacesWithinNSpacesOfTargetNode(2),
            new ApplyDivineVeinNode(DivineVeinType.Stone, new TargetGroupNode(), 1),
        ),
    );
    // After unit acts (if Canto triggers, after Canto), or,
    AFTER_UNIT_ACTS_IF_CANTO_TRIGGERS_AFTER_CANTO_HOOKS.addSkill(skillId, applyDivineVeinFunc);
    // if defending in Aether Raids,
    // at the start of enemy phase,
    AT_START_OF_ENEMY_PHASE_HOOKS.addSkill(skillId, () => new SkillEffectNode(
            IF_NODE(WHEN_DEFENDING_IN_AETHER_RAIDS_NODE,
                applyDivineVeinFunc(),
            ),
        )
    );

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If foe initiates combat or foe's HP ≥ 75% at start of combat,
        IF_FOE_INITIATES_COMBAT_OR_IF_FOES_HP_GTE_75_PERCENT_AT_START_OF_COMBAT(
            // inflicts Atk/Def-10 on foe,
            new InflictsStatsMinusOnFoeDuringCombatNode(10, 0, 10, 0),
            // grants Special cooldown count-2 to unit before foe's first attack,
            new GrantsSpecialCooldownCountMinusNToTargetBeforeTargetsFoesFirstAttackDuringCombatNode(2),
            // and reduces the percentage of foe's non-Special "reduce damage by X%" skills by 50% during combat (excluding area-of-effect Specials).
            REDUCES_PERCENTAGE_OF_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE,
        ),
    ));
}

// 盟友との絆の剣
{
    let skillId = Weapon.FellowshipBlade;
    // Accelerates Special trigger (cooldown count-1).
    // At start of player phase or enemy phase,
    let nodeFunc = () => new SkillEffectNode(
        // if unit is within 2 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_2_SPACES_OF_TARGETS_ALLY_NODE,
            new ForEachTargetAndTargetsAllyWithin2SpacesOfTargetNode(TRUE_NODE,
                // grants Def/Res+6,
                new GrantsStatsPlusAtStartOfTurnNode(0, 0, 6, 6),
                // (Bulwark),
                // and (Null Panic) to unit and allies within 2 spaces of unit for 1 turn.
                new GrantsStatusEffectsAtStartOfTurnNode(StatusEffectType.Bulwark, StatusEffectType.NullPanic),
            ),
        ),
    );
    AT_START_OF_TURN_HOOKS.addSkill(skillId, nodeFunc);
    AT_START_OF_ENEMY_PHASE_HOOKS.addSkill(skillId, nodeFunc);

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit is within 3 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_TARGETS_ALLY_NODE,
            X_NUM_NODE(
                // inflicts penalty on
                // foe's Atk/Def = 20% of unit's Def at start of combat + 6,
                new InflictsStatsMinusOnFoeDuringCombatNode(READ_NUM_NODE, 0, READ_NUM_NODE, 0),
                ADD_NODE(PERCENTAGE_NODE(20, UNITS_DEF_AT_START_OF_COMBAT_NODE), 6),
            ),
            X_NUM_NODE(
                // unit deals +X damage
                new UnitDealsDamageExcludingAoeSpecialsNode(READ_NUM_NODE),
                // reduces damage from foe's attacks by 50% of X (excluding area-of-effect Specials),
                new ReducesDamageFromTargetsFoesAttacksByXDuringCombatNode(PERCENTAGE_NODE(50, READ_NUM_NODE)),
                // (X = highest total bonuses among unit and allies within 2 spaces of unit; excluding area-of-effect Specials),
                HIGHEST_TOTAL_BONUSES_AMONG_UNIT_AND_ALLIES_WITHIN_N_SPACES_NODE(2),
            ),
            // and inflicts Special cooldown charge - 1 on foe per attack during combat (only highest value applied; does not stack).
            INFLICTS_SPECIAL_COOLDOWN_CHARGE_MINUS_1_ON_FOE_NODE,
        ),
    ));
}

// 追撃の斧+
{
    let skillId = Weapon.PursualAxePlus;
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit initiates combat or is within 2 spaces of an ally,
        IF_UNIT_INITIATES_COMBAT_OR_IS_WITHIN_2_SPACES_OF_AN_ALLY(
            // grants Atk/Def+5 to unit during combat and unit makes a guaranteed follow-up attack.
            new GrantsStatsPlusToTargetDuringCombatNode(5, 0, 5, 0),
            UNIT_MAKES_GUARANTEED_FOLLOW_UP_ATTACK_NODE,
        ),
    ));
}

// 露払い・不屈
{
    let skillId = PassiveC.LookoutForce;
    // Enables [Canto (2)] •
    enablesCantoN(skillId, 2);

    // When Canto triggers,
    // If unit initiates combat or is within 2 spaces of an ally,
    // grants Atk/Spd+4 to unit and neutralizes unit's penalties to Atk/Spd during combat.
    WHEN_CANTO_TRIGGERS_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        new EnablesTargetToUseCantoAssistOnTargetsAllyNode(AssistType.Move, CantoSupport.Swap, 2),
    ));

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit initiates combat or is within 2 spaces of an ally,
        IF_UNIT_INITIATES_COMBAT_OR_IS_WITHIN_2_SPACES_OF_AN_ALLY(
            // grants Atk/Spd+4 to unit and neutralizes unit's penalties to Atk/Spd during combat.
            new GrantsStatsPlusToTargetDuringCombatNode(4, 4, 0, 0),
            new NeutralizesPenaltiesToTargetsStatsNode(true, true, false, false),
        ),
    ));
}

// 暗香疎影
{
    let skillId = PassiveB.DarkPerfume;
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of turn,
        // grants Special cooldown count-1 to unit,
        new GrantsSpecialCooldownCountMinusOnTargetAtStartOfTurnNode(1),
        // inflicts (Undefended) and status preventing counterattacks on closest foes through their next actions,
        new ForEachUnitNode(new TargetsClosestFoesNode(), TRUE_NODE,
            new InflictsStatusEffectsAtStartOfTurnNode(StatusEffectType.Undefended),
        ),
        // and inflicts status preventing counterattacks on foes within 2 spaces of those foes through their next actions.
        new ForEachUnitNode(new TargetsClosestFoesNode(), TRUE_NODE,
            new ForEachTargetsAllyWithinNSpacesNode(2, TRUE_NODE,
                new InflictsStatusEffectsAtStartOfTurnNode(StatusEffectType.CounterattacksDisrupted),
            ),
        ),
    ));

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of combat,
        // if unit's HP ≥ 25%,
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE(
            // inflicts Atk/Spd/Def-5 on foe,
            new InflictsStatsMinusOnFoeDuringCombatNode(5, 5, 5, 0),
            // deals damage = 20% of unit's Spd
            // (including when dealing damage with an area-of-effect Special),
            DEALS_DAMAGE_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS(20, UNITS_SPD_DURING_COMBAT_NODE),
            // and neutralizes effects that inflict "Special cooldown charge -X" on unit during combat.
        ),
    ));

    BEFORE_AOE_SPECIAL_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // deals damage = 20% of unit's Spd
        // (including when dealing damage with an area-of-effect Special),
        new UnitDealsDamageBeforeCombatNode(PERCENTAGE_NODE(20, UNITS_SPD_DURING_COMBAT_NODE)),
    ));

    // While attacking in Aether Raids,
    // if unit ends movement on a space with a Bolt Trap or a Heavy Trap,
    // cancels trap's effect; if unit ends movement on a space with a Hex Trap,
    // reduces trap's trigger condition by 10 HP.
    DISARM_TRAP_SKILL_SET.add(skillId);
    DISARM_HEX_TRAP_SKILL_SET.add(skillId);
}

// 魔器・姿なき影刃
{
    let skillId = Weapon.ArcaneSlyKnife;
    // Arcane Sly Knife
    // Mt: 14 Rng:2
    // Accelerates Special trigger (cooldown count-1).
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of combat, if unit's HP ≥ 25%, grants bonus to
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE(
            // unit's Atk/Spd/Def/Res = 25% of foe's Atk at start of combat - 4 (min 5; max 14),
            new GrantsAllStatsPlusNToTargetDuringCombatNode(
                new EnsureMinMaxNode(
                    SUB_NODE(PERCENTAGE_NODE(25, FOES_ATK_AT_START_OF_COMBAT_NODE), 4),
                    5, 14,
                )
            ),
            // neutralizes foe's bonuses to Spd/Def,
            new NeutralizesFoesBonusesToStatsDuringCombatNode(false, true, true, false),
            // deals damage = 15% of unit's Atk
            // (including when dealing damage with an area-of-effect Special),
            DEALS_DAMAGE_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS(15, UNITS_ATK_DURING_COMBAT_NODE),
            // reduces damage from foe's first attack by 7
            new ReducesDamageFromFoesFirstAttackByNDuringCombatIncludingTwiceNode(7),
            // ("first attack" normally means only the first strike; for effects that grant "unit attacks twice," it means the first and second strikes),
            // and grants Special cooldown count- 1 to unit before unit's first attack during combat.
            new GrantsSpecialCooldownCountMinusNToTargetBeforeTargetsFirstAttackDuringCombatNode(1),
        ),
    ));

    BEFORE_AOE_SPECIAL_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE(
            // deals damage = 15% of unit's Atk
            // (including when dealing damage with an area-of-effect Special),
            new UnitDealsDamageBeforeCombatNode(PERCENTAGE_NODE(15, UNITS_ATK_AT_START_OF_COMBAT_NODE)),
        )
    ))
}

// 正面隊形・敵方4
{
    let skillId = PassiveB.WilyFighter4;
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If foe initiates combat or if unit's HP ≥ 25% at start of combat,
        IF_NODE(OR_NODE(DOES_FOE_INITIATE_COMBAT_NODE, IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE),
            // inflicts Atk-5 on foe,
            new InflictsStatsMinusOnFoeDuringCombatNode(5, 0, 0, 0),
            new AppliesSkillEffectsAfterStatusFixedNode(
                X_NUM_NODE(
                    // deals +X damage (X = 20% of unit's Def; excluding area-of-effect Specials),
                    new UnitDealsDamageExcludingAoeSpecialsNode(READ_NUM_NODE),
                    // reduces damage from foe's attacks by X (excluding area-of-effect Specials),
                    new ReducesDamageFromTargetsFoesAttacksByXDuringCombatNode(READ_NUM_NODE),
                    PERCENTAGE_NODE(20, UNITS_DEF_DURING_COMBAT_NODE),
                ),
            ),
            // unit makes a guaranteed follow-up attack,
            UNIT_MAKES_GUARANTEED_FOLLOW_UP_ATTACK_NODE,
            // and neutralizes foe's bonuses during combat.
            NEUTRALIZES_FOES_BONUSES_TO_STATS_DURING_COMBAT_NODE,
        )
    ));
}

// 正面隊形・自己4
{
    let skillId = PassiveB.SlickFighter4;
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If foe initiates combat or if unit's HP ≥ 25% at start of combat,
        IF_NODE(OR_NODE(DOES_FOE_INITIATE_COMBAT_NODE, IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE),
            // inflicts Atk-5 on foe,
            new InflictsStatsMinusOnFoeDuringCombatNode(5, 0, 0, 0),
            new AppliesSkillEffectsAfterStatusFixedNode(
                X_NUM_NODE(
                    // deals +X damage (X = 20% of unit's Def; excluding area-of-effect Specials),
                    new UnitDealsDamageExcludingAoeSpecialsNode(READ_NUM_NODE),
                    // reduces damage from foe's attacks by X (excluding area-of-effect Specials),
                    new ReducesDamageFromTargetsFoesAttacksByXDuringCombatNode(READ_NUM_NODE),
                    PERCENTAGE_NODE(20, UNITS_DEF_DURING_COMBAT_NODE),
                ),
            ),
            // unit makes a guaranteed follow-up attack,
            UNIT_MAKES_GUARANTEED_FOLLOW_UP_ATTACK_NODE,
            // and neutralizes penalties on unit during combat.
            NEUTRALIZES_PENALTIES_ON_UNIT_NODE,
        )
    ));
}

// 毒も薬に、薬も毒に
{
    let skillId = getStatusEffectSkillId(StatusEffectType.Dosage);
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode());
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // Grants Atk/Spd/Def/Res+5 to unit during combat and restores 10 HP to unit after combat.
        GRANTS_ALL_STATS_PLUS_5_TO_UNIT_DURING_COMBAT_NODE,
        RESTORES_10_HP_TO_UNIT_AFTER_COMBAT_NODE,
    ));

    // stealBonusEffectsに実装されている
    // TODO: リファクタリング
    // When a foe triggers "grants the【Bonus】 effects active on foe" and "neutralizes any 【Bonus】active on foe" effects from skills such as Essence Drain on unit with this status active,
    // prevents those effects on unit and other targets and neutralizes any【Bonus】effects active on that foe (does not neutralize【Bonus】 effects applied at the same time).
}

// 神獣の猛毒
{
    let skillId = PassiveA.DivineToxin;
    // If unit can transform,
    // transformation effects gain "if unit is within 2 spaces of a beast or dragon ally,
    // or if number of adjacent allies other than beast or dragon allies ≤ 2" as a trigger condition (in addition to existing conditions).
    setEffectThatTransformationEffectsGainAdditionalTriggerCondition(skillId);

    // If defending in Aether Raids,
    // at the start of enemy turn 1,
    // if conditions for transforming are met,
    // unit transforms.
    setEffectThatIfDefendingInARAtStartOfEnemyTurn1UnitTransforms(skillId);

    // At start of player phase or enemy phase,
    // grants【Dosage】to unit and allies within 2 spaces of unit for 1 turn.
    let nodeFunc = () => new SkillEffectNode(
        new ForEachTargetAndTargetsAllyWithin2SpacesOfTargetNode(TRUE_NODE,
            new GrantsStatusEffectsOnTargetOnMapNode(StatusEffectType.Dosage),
        ),
    );
    AT_START_OF_TURN_HOOKS.addSkill(skillId, nodeFunc);
    AT_START_OF_ENEMY_PHASE_HOOKS.addSkill(skillId, nodeFunc);

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit is transformed or if foe initiates combat,
        IF_NODE(OR_NODE(new IsTargetTransformedNode(), DOES_FOE_INITIATE_COMBAT_NODE),
            // grants Atk/Def/Res+10 to unit,
            new GrantsStatsPlusToTargetDuringCombatNode(10, 0, 10, 10),
            // neutralizes foe's bonuses to Atk/Def,
            new NeutralizesFoesBonusesToStatsDuringCombatNode(true, false, true, false),
            // grants Special cooldown charge +1 to unit per attack (only highest value applied; does not stack),
            GRANTS_SPECIAL_COOLDOWN_CHARGE_PLUS_1_TO_UNIT_PER_ATTACK_DURING_COMBAT_NODE,
            // and neutralizes effects that inflict "Special cooldown charge -X" on unit during combat.
            NEUTRALIZES_EFFECTS_THAT_INFLICT_SPECIAL_COOLDOWN_CHARGE_MINUS_X_ON_UNIT,
        ),
    ));
}

// 毒の葬り手の妖牙
{
    let skillId = Weapon.EnticingDose;
    // Accelerates Special trigger (cooldown count-1).
    // At start of turn and after unit acts (if Canto triggers, after Canto), inflicts Atk/Def-7 and 【Sabotage】on foes within 3 rows or 3 columns centered on unit through their next actions.
    let nodeFunc = () => new SkillEffectNode(
        new ForEachUnitNode(new TargetsFoesOnMapNode(), IS_TARGET_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_SKILL_OWNER_NODE,
            new InflictsStatsMinusOnTargetOnMapNode(7, 0, 7, 0),
            new InflictsStatusEffectsOnTargetOnMapNode(StatusEffectType.Sabotage),
        ),
    );
    AT_START_OF_TURN_HOOKS.addSkill(skillId, nodeFunc);
    AFTER_UNIT_ACTS_IF_CANTO_TRIGGERS_AFTER_CANTO_HOOKS.addSkill(skillId, nodeFunc);

    // At start of turn, if unit is adjacent to only beast or dragon allies or if unit is not adjacent to any ally, unit transforms (otherwise, unit reverts). If unit transforms, grants Atk+2, and unit can counterattack regardless of foe's range.
    setBeastSkill(skillId, BeastCommonSkillType.Armor);

    // TODO: 反撃可能判定後フックを作成するか検討する
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
        IF_NODE(OR_NODE(new IsTargetTransformedNode(), IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE),
            new NumThatIsNode(
                // inflicts penalty on foe's Atk/Def = 6 + 20% of unit's Def at start of combat,
                new InflictsStatsMinusOnFoeDuringCombatNode(READ_NUM_NODE, 0, READ_NUM_NODE, 0),
                ADD_NODE(6, PERCENTAGE_NODE(20, UNITS_DEF_AT_START_OF_COMBAT_NODE)),
            ),
            // reduces the percentage of foe's non-Special "reduce damage by X%" skills by 50% (excluding area-of-effect Specials),
            REDUCES_PERCENTAGE_OF_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE,
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
}

// 縄張り・守護
{
    let skillId = PassiveC.Barricade;
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
        // If unit is within 3 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_TARGETS_ALLY_NODE,
            // grants Def/Res+4 to unit and neutralizes unit's penalties to Def/Res during combat.
            new GrantsStatsPlusToTargetDuringCombatNode(0, 0, 4, 4),
            new NeutralizesPenaltiesToTargetsStatsNode(false, false, true, true),
        )
    ));

    // Grants Def/Res+4 to allies within 3 spaces of unit and neutralizes their penalties to Def/Res during their combat.
    FOR_ALLIES_GRANTS_STATS_PLUS_TO_ALLIES_DURING_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_SKILL_OWNER_NODE,
            new GrantsStatsPlusToTargetDuringCombatNode(0, 0, 4, 4),
        )
    ));
    FOR_ALLIES_GRANTS_EFFECTS_TO_ALLIES_DURING_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_SKILL_OWNER_NODE,
            new NeutralizesPenaltiesToTargetsStatsNode(false, false, true, true),
        )
    ));
}

// 世界樹の半身
{
    let skillId = PassiveB.YggdrasillsAlter;
    // At start of player phase or enemy phase, inflicts Atk/Def-7 and【Discord】on foes that are within 2 spaces of another foe through their next actions.
    let nodeFunc = () => new SkillEffectNode(
        new ForEachUnitNode(TARGETS_FOES_NODE,
            IS_TARGET_WITHIN_2_SPACES_OF_TARGETS_ALLY_NODE,

            new InflictsStatsMinusAtStartOfTurnNode(7, 0, 7, 0),
            new InflictsStatusEffectsAtStartOfTurnNode(StatusEffectType.Discord),
        ),
    );
    AT_START_OF_TURN_HOOKS.addSkill(skillId, nodeFunc);
    AT_START_OF_ENEMY_PHASE_HOOKS.addSkill(skillId, nodeFunc);

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        new NumThatIsNode(
            // Inflicts penalty on foe's Atk/Def during combat = number of foes on the map with the【Discord】 effect active (including target) × 3 + 5 (max 14),
            new InflictsStatsMinusOnFoeDuringCombatNode(READ_NUM_NODE, 0, READ_NUM_NODE, 0),
            new EnsureMaxNode(
                ADD_NODE(
                    MULT_NODE(NUM_OF_TARGETS_FOES_ON_MAP_WITH_STATUS_EFFECT_ACTIVE_NODE(StatusEffectType.Discord), 3),
                    5,
                ),
                14,
            ),
        ),
        // deals damage = 20% of unit's Res (excluding area-of-effect Specials),
        DEALS_DAMAGE_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS(20, UNITS_RES_DURING_COMBAT_NODE),
        // and unit makes a guaranteed follow-up attack during combat,
        UNIT_MAKES_GUARANTEED_FOLLOW_UP_ATTACK_NODE,
        // and also,
        // when Special triggers,
        // neutralizes foe's "reduces damage by X%" effects from foe's non-Special skills during combat (excluding area-of-effect Specials).
        WHEN_SPECIAL_TRIGGERS_NEUTRALIZES_FOES_REDUCES_DAMAGE_BY_PERCENTAGE_EFFECTS_FROM_FOES_NON_SPECIAL_EXCLUDING_AOE_SPECIALS_NODE,
    ));
}

// 心の葬り手の枝
{
    let skillId = Weapon.QuietingBranch;
    // 威力14
    // 射程1
    // 奥義が発動しやすい（発動カウントー1）
    // ターン開始時、竜、獣以外の味方と隣接していない場合
    // 化身状態になる（そうでない場合、化身状態を解除）
    // 化身状態なら、攻撃＋2、かつ敵から攻撃された時、距離に関係なく反撃する
    setBeastSkill(skillId, BeastCommonSkillType.Armor);

    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // ターン開始時、自身のHPが25%以上なら、
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_TURN_NODE(
            // 最も近い敵とその周囲2マス以内の敵の守備、魔防ー7、【パニック】、【混乱】（敵の次回行動終了まで）、
            new ForEachTargetsClosestFoeAndAnyFoeWithin2SpacesOfThoseFoesNode(TRUE_NODE,
                new InflictsStatsMinusAtStartOfTurnNode(0, 0, 7, 7),
                new InflictsStatusEffectsAtStartOfTurnNode(StatusEffectType.Panic, StatusEffectType.Sabotage),
            ),
            // かつ最も近い敵とその周囲2マス以内の射程1の敵の中で最も守備が低い敵と
            // 射程2の敵の中で最も守備が低い敵に【指名】、反撃不可の状態異常を付与
            // （反撃不可の状態異常は敵の次回行動終了まで）
            new ForEachUnitNode(new UniteUnitsNode(
                    new MinUnitsNode(
                        TARGETS_CLOSEST_FOES_AND_FOES_ALLIES_WITHIN_N_SPACES_OF_THOSE_FOES_NODE(2,
                            new IsTargetMeleeWeaponNode()),
                        TARGETS_EVAL_DEF_ON_MAP),
                    new MinUnitsNode(
                        TARGETS_CLOSEST_FOES_AND_FOES_ALLIES_WITHIN_N_SPACES_OF_THOSE_FOES_NODE(2,
                            new IsTargetRangedWeaponNode()),
                        TARGETS_EVAL_DEF_ON_MAP)),
                TRUE_NODE,
                new GrantsStatusEffectsAtStartOfTurnNode(StatusEffectType.AssignDecoy),
                new InflictsStatusEffectsAtStartOfTurnNode(StatusEffectType.CounterattacksDisrupted),
            ),
        ),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // 戦闘開始時、自身のHPが25%以上なら、
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE(
            new NumThatIsNode(
                // 戦闘中、敵の攻撃、守備が、戦闘開始時の自分の魔防の20%＋6だけ減少、
                new InflictsStatsMinusOnFoeDuringCombatNode(READ_NUM_NODE, 0, READ_NUM_NODE, 0),
                ADD_NODE(PERCENTAGE_NODE(20, UNITS_RES_AT_START_OF_COMBAT_NODE), 6),
            ),
            // 敵の最初の攻撃前に自分の奥義発動カウントー2、
            new GrantsSpecialCooldownCountMinusNToUnitBeforeFoesFirstAttackDuringCombatNode(2),
            new AppliesSkillEffectsAfterStatusFixedNode(
                // 自分が受けるダメージー魔防の20%（範囲奥義を除く）、
                new ReducesDamageExcludingAoeSpecialsNode(PERCENTAGE_NODE(20, UNITS_RES_DURING_COMBAT_NODE)),
                // かつ、敵の奥義による攻撃の時、さらに、自分が受けるダメージー魔防の20％（範囲奥義を除く）、
                new ReducesDamageWhenFoesSpecialExcludingAoeSpecialNode(PERCENTAGE_NODE(20, UNITS_RES_DURING_COMBAT_NODE)),
            ),
            // 戦闘後・7回復
            RESTORES_7_HP_TO_UNIT_AFTER_COMBAT_NODE,
        ),
    ));
}

// 凶弾・神
{
    let skillId = Special.BrutalShellPlus;
    NORMAL_ATTACK_SPECIAL_SET.add(skillId);
    setSpecialCount(3);

    // 奥義発動時、 自分と敵の守備の高い方の値の50%を奥義ダメージに加算
    WHEN_APPLIES_SPECIAL_EFFECTS_AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        new BoostsDamageWhenSpecialTriggersNode(
            MULT_TRUNC_NODE(0.5, MAX_NODE(UNITS_DEF_DURING_COMBAT_NODE, FOES_RES_DURING_COMBAT_NODE)),
        ),
    ));

    // 自分または敵が奥義発動可能状態の時、または、この戦闘（戦闘前、戦闘中）で自分または敵が奥義発動済みの時、戦闘中、受けた攻撃のダメージを40%軽減（1戦闘1回のみ） （範囲奥義を除く）
    AT_APPLYING_ONCE_PER_COMBAT_DAMAGE_REDUCTION_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        IF_NODE(IS_THE_UNITS_OR_FOES_SPECIAL_READY_OR_WAS_THE_UNITS_OR_FOES_SPECIAL_TRIGGERED_BEFORE_OR_DURING_THIS_COMBAT,
            new ReducesDamageFromTargetsFoesNextAttackByNPercentOncePerCombatNode(40),
        ),
    ));

    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // 1～4ターン目始時、奥義発動カウントー3
        IF_NODE(LTE_NODE(CURRENT_TURN_NODE, 4),
            new GrantsSpecialCooldownCountMinusOnTargetAtStartOfTurnNode(3),
        )
    ));
}

// 神槌大地を穿つ・神
{
    let skillId = PassiveC.WorldbreakerPlus;
    // 周囲2マス以内の味方は、自身の周囲2マス以内に移動可能
    setSkillThatAlliesWithinNSpacesOfUnitCanMoveToAnySpaceWithinMSpacesOfUnit(skillId, 2, 2);
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // 戦闘中、攻撃、守備、魔防＋5、自身の奥義発動カウント変動量＋1 （同系統効果複数時、最大值適用）、 自分の最初の攻撃前に奥義発動カウントー2
        new GrantsStatsPlusToTargetDuringCombatNode(5, 0, 5, 5),
        new GrantsSpecialCooldownChargePlus1ToTargetPerAttackDuringCombatNode(),
        new GrantsSpecialCooldownCountMinusNToTargetBeforeTargetsFirstAttackDuringCombatNode(2),
    ));
    // 周囲3マス以内の味方は、戦闘中、攻撃、守備、魔防＋4、 奥義発動カウント変動量＋1 （同系統効果複数時、最大値適用）、戦闘中、最初の攻撃前に奥義発動カウントー1
    FOR_ALLIES_GRANTS_STATS_PLUS_TO_ALLIES_DURING_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        new GrantsStatsPlusToTargetDuringCombatNode(4, 0, 4, 4),
        new GrantsSpecialCooldownChargePlus1ToTargetPerAttackDuringCombatNode(),
        new GrantsSpecialCooldownCountMinusNToTargetBeforeTargetsFirstAttackDuringCombatNode(1),
    ));
}

// アーリアル
{
    let skillId = getNormalSkillId(Weapon.Aureola);
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // 自分から攻撃した時、または周囲2マスに味方がいる時、戦闘中、攻撃、速さ、魔防+5、かつ、敵の「敵の守備か魔防の低い方でダメージ計算」を無効化、かつ、戦闘後、自分と周囲2マスの味方を7回復
        IF_UNIT_INITIATES_COMBAT_OR_IS_WITHIN_2_SPACES_OF_AN_ALLY(
            new GrantsAllStatsPlusNToTargetDuringCombatNode(5, 5, 0, 5),
            new DisablesTargetsFoesSkillsThatCalculateDamageUsingTheLowerOfTargetsFoesDefOrResDuringCombatNode(),
        ),
    ));
    AFTER_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        new ForEachTargetAndTargetsAllyWithin2SpacesOfTargetNode(TRUE_NODE,
            new RestoreTargetsHpOnMapNode(7),
        ),
    ))
}
{
    let skillId = getRefinementSkillId(Weapon.Aureola);
    // Grants Res+3. Effective against magic foes.
    // Restores 7 HP to unit and allies within 2 spaces of unit after combat.
    AFTER_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        new ForEachTargetAndTargetsAllyWithin2SpacesOfTargetNode(TRUE_NODE,
            new RestoreTargetsHpOnMapNode(7),
        ),
    ))
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit initiates combat or if unit is within 2 spaces of an ally,
        IF_UNIT_INITIATES_COMBAT_OR_IS_WITHIN_2_SPACES_OF_AN_ALLY(
            // grants Atk/Spd/Def/Res+5,
            GRANTS_ALL_STATS_PLUS_5_TO_UNIT_DURING_COMBAT_NODE,
            // disables foe's effects that "calculate damage using the lower of foe's Def or Res,"
            new DisablesTargetsFoesSkillsThatCalculateDamageUsingTheLowerOfTargetsFoesDefOrResDuringCombatNode(),
            new NumThatIsNode(
                new SkillEffectNode(
                    // unit deals X damage (excluding area-of-effect Specials),
                    new UnitDealsDamageExcludingAoeSpecialsNode(READ_NUM_NODE),
                    // and reduces damage from foe's first attack by 40% of X during combat
                    new ReducesDamageFromFoesFirstAttackByNDuringCombatIncludingTwiceNode(PERCENTAGE_NODE(40, READ_NUM_NODE)),
                ),
                // (X = highest total bonuses among unit and allies within 2 spaces of unit; "first attack" normally means only the first strike; for effects that grant "unit attacks twice," it means the first and second strikes).
                new HIGHEST_TOTAL_BONUSES_AMONG_UNIT_AND_ALLIES_WITHIN_N_SPACES_NODE(2),
            ),
        ),
    ));
}
{
    let skillId = getSpecialRefinementSkillId(Weapon.Aureola);
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of turn,
        // if unit is within 2 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_2_SPACES_OF_TARGETS_ALLY_NODE,
            new ForEachTargetAndTargetsAllyWithin2SpacesOfTargetNode(TRUE_NODE,
                // grants Spd/Res+6 and "neutralizes penalties on unit during combat" to unit and allies within 2 spaces of unit for 1 turn.
                new GrantsStatsPlusAtStartOfTurnNode(0, 6, 0, 6),
                new GrantsStatusEffectsAtStartOfTurnNode(StatusEffectType.NeutralizesPenalties),
            ),
        )
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If foe initiates combat or foe's HP ≥ 75% at start of combat,
        IF_FOE_INITIATES_COMBAT_OR_IF_FOES_HP_GTE_75_PERCENT_AT_START_OF_COMBAT(
            // grants Atk/Spd/Def/Res+5 to unit,
            GRANTS_ALL_STATS_PLUS_5_TO_UNIT_DURING_COMBAT_NODE,
            // neutralizes effects that inflict "Special cooldown charge -X" on unit,
            NEUTRALIZES_EFFECTS_THAT_INFLICT_SPECIAL_COOLDOWN_CHARGE_MINUS_X_ON_UNIT,
            // and inflicts Special cooldown charge -1 on foe per attack during combat (only highest value applied; does not stack).
            INFLICTS_SPECIAL_COOLDOWN_CHARGE_MINUS_1_ON_FOE_NODE,
        ),
    ));
}

// 生存本能の弓
{
    let skillId = getNormalSkillId(Weapon.SurvivalistBow);
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // 周囲1マス以内に味方がいない時、戦闘中、攻撃、速さ+6、かつ、戦闘開始時の敵のHPが80%以上なら、敵は反撃不可
        IF_NODE(EQ_NODE(new NumOfTargetsAlliesWithinNSpacesNode(1), 0),
            new GrantsStatsPlusToTargetDuringCombatNode(6, 6, 0, 0),
            IF_NODE(GTE_NODE(FOES_HP_PERCENTAGE_AT_START_OF_COMBAT_NODE, 80),
                FOE_CANNOT_COUNTERATTACK_NODE,
            ),
        ),
    ));
}
{
    let skillId = getRefinementSkillId(Weapon.SurvivalistBow);
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // 自分から攻撃した時、または、周囲1マス以内の味方が1体以下の時、戦闘中、攻撃、速さ+6、自分の最初の攻撃前に奥義発動カウント-1、かつ、戦闘開始時の敵のHPが50%以上なら、敵は反撃不可
        IF_NODE(OR_NODE(DOES_UNIT_INITIATE_COMBAT_NODE, LTE_NODE(new NumOfTargetsAlliesWithinNSpacesNode(1), 1)),
            new GrantsStatsPlusToTargetDuringCombatNode(6, 6, 0, 0),
            new GrantsSpecialCooldownCountMinusNToTargetBeforeTargetsFirstAttackDuringCombatNode(1),
            IF_NODE(GTE_NODE(FOES_HP_PERCENTAGE_AT_START_OF_COMBAT_NODE, 50),
                FOE_CANNOT_COUNTERATTACK_NODE,
            ),
        ),
    ));
}
{
    let skillId = getSpecialRefinementSkillId(Weapon.SurvivalistBow);
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // ターン開始時、自身のHPが25%以上なら、最も近い敵とその周囲2マス以内の敵の速さ、守備-7、【混乱】を付与(敵の次回行動終了まで)
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_TURN_NODE(
            new ForEachTargetsClosestFoeAndAnyFoeWithin2SpacesOfThoseFoesNode(TRUE_NODE,
                new InflictsStatsMinusAtStartOfTurnNode(0, 7, 7, 0),
                new InflictsStatusEffectsAtStartOfTurnNode(StatusEffectType.Sabotage),
            )
        )
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // 戦闘開始時、自身のHPが25%以上なら、戦闘中、攻撃、速さ+6、攻撃、速さの弱化を無効、ダメージ+速さの20％(範囲奥義を除く)
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE(
            new GrantsStatsPlusToTargetDuringCombatNode(6, 6, 0, 0),
            new NeutralizesPenaltiesToTargetsStatsNode(true, true, false, false),
            new AppliesSkillEffectsAfterStatusFixedNode(
                new UnitDealsDamageExcludingAoeSpecialsNode(PERCENTAGE_NODE(20, UNITS_SPD_DURING_COMBAT_NODE)),
            ),
        )
    ));
}

// 機斧ロヴンヘイズ
{
    let skillId = getNormalSkillId(Weapon.AutoLofnheior);
    // 1~4ターン目の間、【再移動(3)】を発動可能
    CAN_TRIGGER_CANTO_HOOKS.addSkill(skillId, () => LTE_NODE(CURRENT_TURN_NODE, 4));
    CALCULATES_DISTANCE_OF_CANTO_HOOKS.addSkill(skillId, () => new ConstantNumberNode(3));

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // 自分から攻撃した時、または、周囲2マス以内に味方がいる時、戦闘中、攻撃+6、敵の攻撃-6、自分は絶対追撃
        IF_UNIT_INITIATES_COMBAT_OR_IS_WITHIN_2_SPACES_OF_AN_ALLY(
            new GrantsStatsPlusToTargetDuringCombatNode(6, 0, 0, 0),
            new InflictsStatsMinusOnFoeDuringCombatNode(6, 0, 0, 0),
            UNIT_MAKES_GUARANTEED_FOLLOW_UP_ATTACK_NODE,
        )
    ));
}
{
    let skillId = getRefinementSkillId(Weapon.AutoLofnheior);
    // 1〜4ターン目の間、【再移動(3)】を発動可能
    CAN_TRIGGER_CANTO_HOOKS.addSkill(skillId, () => LTE_NODE(CURRENT_TURN_NODE, 4));
    CALCULATES_DISTANCE_OF_CANTO_HOOKS.addSkill(skillId, () => new ConstantNumberNode(3));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // 自分から攻撃した時、または、周囲2マス以内に味方がいる時、戦闘中、攻撃+6、敵の攻撃-6、自分は絶対追撃、
        IF_UNIT_INITIATES_COMBAT_OR_IS_WITHIN_2_SPACES_OF_AN_ALLY(
            new GrantsStatsPlusToTargetDuringCombatNode(6, 0, 0, 0),
            new InflictsStatsMinusOnFoeDuringCombatNode(6, 0, 0, 0),
            UNIT_MAKES_GUARANTEED_FOLLOW_UP_ATTACK_NODE,
            // 敵は追撃不可、かつ奥義発動時、敵の奥義以外のスキルによる「ダメージを○○%軽減」を無効(範囲奥義を除く)
            FOE_CANNOT_MAKE_FOLLOW_UP_ATTACK_NODE,
            WHEN_SPECIAL_TRIGGERS_NEUTRALIZES_FOES_REDUCES_DAMAGE_BY_PERCENTAGE_EFFECTS_FROM_FOES_NON_SPECIAL_EXCLUDING_AOE_SPECIALS_NODE,
            // (自身の移動タイプで移動、例：歩行は、林には移動しづらい)(攻撃、補助、地形破壊不可)(同系統効果重複時、最大値適用)(1ターンに1回のみ)(行動直後に再行動可能にするスキル発動時は、再行動で条件を満たせば、再移動が可能)(再移動できる距離は、通常の移動の距離とは無関係)(再移動の距離の上限を超えたワープ移動はできない)
        )
    ));
}
{
    let skillId = getSpecialRefinementSkillId(Weapon.AutoLofnheior);
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // ターン開始時、自身のHPが25%以上なら、自分と周囲2マス以内の味方に「自分が移動可能な地形を平地のように移動可能』、【奮激】を付与(1ターン)
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_TURN_NODE(
            new ForEachTargetAndTargetsAllyWithin2SpacesOfTargetNode(TRUE_NODE,
                new GrantsStatusEffectsAtStartOfTurnNode(StatusEffectType.UnitCannotBeSlowedByTerrain, StatusEffectType.Incited),
            ),
        )
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // 戦闘開始時、自身のHPが25%以上なら、戦闘中、自身の攻撃、守備、魔防+5、敵の攻撃、守備が敵が受けている攻撃、守備の強化の値の2倍だけ減少(能力値ごとに計算)、
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE(
            new GrantsStatsPlusToTargetDuringCombatNode(5, 5, 0, 0),
            new InflictsBonusReversalPenaltyOnTargetsFoeNode(true, true, false, false),
        ),
        // 自分が与えるダメージ+自分の守備の20%(範囲奥義を除く)
        new AppliesSkillEffectsAfterStatusFixedNode(
            new UnitDealsDamageExcludingAoeSpecialsNode(PERCENTAGE_NODE(20, UNITS_DEF_DURING_COMBAT_NODE)),
        ),
    ));
}

// 神槌ミョルニル
{
    let skillId = getNormalSkillId(Weapon.WarGodMjolnir);
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // 戦闘開始時、自身のHPが25%以上なら、戦闘中、攻撃+6、敵の攻撃-6、絶対追撃
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE(
            new GrantsStatsPlusToTargetDuringCombatNode(6, 0, 0, 0),
            new InflictsStatsMinusOnFoeDuringCombatNode(6, 0, 0, 0),
            UNIT_MAKES_GUARANTEED_FOLLOW_UP_ATTACK_NODE,
        ),
        // 戦闘開始時、自身のHPが25%以上、かつ、周囲1マスに味方がいない時、戦闘中、敵の強化の+を無効にする(無効になるのは、鼓舞や応援等の+効果)
        IF_NODE(AND_NODE(
                IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE,
                EQ_NODE(new NumOfTargetsAlliesWithinNSpacesNode(1), 0)),
            NEUTRALIZES_FOES_BONUSES_TO_STATS_DURING_COMBAT_NODE,
        ),
    ));
}
{
    let skillId = getRefinementSkillId(Weapon.WarGodMjolnir);
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // 戦闘開始時、自身のHPが25%以上なら、戦闘中、攻撃+6、敵の攻撃-6、絶対追撃、ダメージ+攻撃の15%(範囲奥義を除く)、敵の強化の+を無効にする(無効になるのは、鼓舞や応援等の+効果)
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE(
            new GrantsStatsPlusToTargetDuringCombatNode(6, 0, 0, 0),
            new InflictsStatsMinusOnFoeDuringCombatNode(6, 0, 0, 0),
            UNIT_MAKES_GUARANTEED_FOLLOW_UP_ATTACK_NODE,
            new AppliesSkillEffectsAfterStatusFixedNode(
                new UnitDealsDamageExcludingAoeSpecialsNode(PERCENTAGE_NODE(15, UNITS_ATK_DURING_COMBAT_NODE)),
            ),
            NEUTRALIZES_FOES_BONUSES_TO_STATS_DURING_COMBAT_NODE,
        )
    ));
}
{
    let skillId = getSpecialRefinementSkillId(Weapon.WarGodMjolnir);
    // 【再移動(2)】を発動可能
    enablesCantoN(skillId, 2);
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // 戦闘開始時、自身のHPが25%以上なら、戦闘中、自身の攻撃+6、敵の攻撃-6、自分が受けるダメージ-自分の攻撃の15%(範囲奥義を除く)、
        // かつ最初に受けた攻撃で軽減した値を、自身の次の攻撃のダメージに+(その戦闘中のみ、軽減値はスキルによる軽減効果も含む)、
        // かつ奥義発動時、敵の奥義以外のスキルによる「ダメージを○○％軽減」を無効(範囲奥義を除く)
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE(
            new GrantsStatsPlusToTargetDuringCombatNode(6, 0, 0, 0),
            new InflictsStatsMinusOnFoeDuringCombatNode(6, 0, 0, 0),
            new AppliesSkillEffectsAfterStatusFixedNode(
                new ReducesDamageExcludingAoeSpecialsNode(PERCENTAGE_NODE(15, UNITS_ATK_DURING_COMBAT_NODE)),
            ),
            TARGETS_NEXT_ATTACK_DEALS_DAMAGE_EQ_TOTAL_DAMAGE_REDUCED_FROM_TARGETS_FOES_FIRST_ATTACK_NODE,
            WHEN_SPECIAL_TRIGGERS_NEUTRALIZES_FOES_REDUCES_DAMAGE_BY_PERCENTAGE_EFFECTS_FROM_FOES_NON_SPECIAL_EXCLUDING_AOE_SPECIALS_NODE,
        )
    ));
}

// 天空の海賊の嘴爪
{
    let skillId = getNormalSkillId(Weapon.SkyPirateClaw);
    setBeastSkill(skillId, BeastCommonSkillType.Flying);
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // 周囲1マス以内に味方がいない時、戦闘中、攻撃+5、敵の攻撃-5、かつ自身は絶対追撃
        IF_NODE(EQ_NODE(new NumOfTargetsAlliesWithinNSpacesNode(1), 0),
            new GrantsStatsPlusToTargetDuringCombatNode(5, 0, 0, 0),
            new InflictsStatsMinusOnFoeDuringCombatNode(5, 0, 0, 0),
            UNIT_MAKES_GUARANTEED_FOLLOW_UP_ATTACK_NODE,
        ),
    ));
}
{
    let skillId = getRefinementSkillId(Weapon.SkyPirateClaw);
    setBeastSkill(skillId, BeastCommonSkillType.Flying);
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // 周囲1マス以内の竜、獣以外の味方が1体以下の時、または、自分が化身時、戦闘中、攻撃、速さ+5、敵の攻撃-5、かつ自身は絶対追撃、敵の奥義以外のスキルによる「ダメージを○○％軽減」を半分無効(無効にする数値は端数切捨て)(範囲奥義を除く)、戦闘後、7回復
        IF_NODE(OR_NODE(
                LTE_NODE(new NumOfTargetsAlliesWithinNSpacesNode(1, IS_TARGET_BEAST_OR_DRAGON_TYPE_NODE), 1),
                new IsTargetTransformedNode()),
            new GrantsStatsPlusToTargetDuringCombatNode(5, 5, 0, 0),
            new InflictsStatsMinusOnFoeDuringCombatNode(5, 0, 0, 0),
            UNIT_MAKES_GUARANTEED_FOLLOW_UP_ATTACK_NODE,
            REDUCES_PERCENTAGE_OF_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE,
            RESTORES_7_HP_TO_UNIT_AFTER_COMBAT_NODE,
        ),
    ));
}
{
    let skillId = getSpecialRefinementSkillId(Weapon.SkyPirateClaw);
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // ターン開始時、自身のHPが25%以上なら、最も近い敵とその周囲2マス以内の敵の速さ、守備-7、【弱点露呈】、【凍結】を付与(敵の次回行動終了まで)
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_TURN_NODE(
            new ForEachTargetsClosestFoeAndAnyFoeWithin2SpacesOfThoseFoesNode(TRUE_NODE,
                new InflictsStatsMinusAtStartOfTurnNode(0, 7, 7, 0),
                new InflictsStatusEffectsAtStartOfTurnNode(StatusEffectType.Exposure),
                new InflictsStatusEffectsAtStartOfTurnNode(StatusEffectType.Frozen),
            ),
        ),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // 戦闘開始時、自身のHPが25%以上なら、戦闘中、攻撃、速さ、守備、魔防+5、ダメージ+自分の攻撃の15％(範囲奥義を除く)、自身の奥義発動カウント変動量-を無効
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE(
            GRANTS_ALL_STATS_PLUS_5_TO_UNIT_DURING_COMBAT_NODE,
            new AppliesSkillEffectsAfterStatusFixedNode(
                new UnitDealsDamageExcludingAoeSpecialsNode(PERCENTAGE_NODE(15, UNITS_ATK_DURING_COMBAT_NODE)),
            ),
            new NeutralizesEffectsThatInflictSpecialCooldownChargeMinusXOnUnit(),
        )
    ));
}

// ダルレカの激斧
{
    let skillId = getNormalSkillId(Weapon.TalreganAxe);
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // 奥義が発動しやすい(発動カウント-1)
        // 自分から攻撃した時、または周囲2マス以内に味方がいる時、戦闘中、攻撃、速さ+6
        IF_UNIT_INITIATES_COMBAT_OR_IS_WITHIN_2_SPACES_OF_AN_ALLY(
            new GrantsStatsPlusToTargetDuringCombatNode(6, 6, 0, 0),
        ),
        // 自分から攻撃した時、追撃可能なら自分の攻撃の直後に追撃を行う
        UNIT_CAN_MAKE_FOLLOW_UP_ATTACK_BEFORE_FOES_NEXT_ATTACK_NODE,
    ));
}
{
    let skillId = getRefinementSkillId(Weapon.TalreganAxe);
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // 自分から攻撃した時、または、周囲2マス以内に味方がいる時、戦闘中、攻撃、速さ+6、自身の奥義発動カウント変動量+1(同系統効果複数時、最大値適用)
        IF_UNIT_INITIATES_COMBAT_OR_IS_WITHIN_2_SPACES_OF_AN_ALLY(
            new GrantsStatsPlusToTargetDuringCombatNode(6, 6, 0, 0),
            new GrantsSpecialCooldownChargePlus1ToTargetPerAttackDuringCombatNode(),
        ),
        // 自分から攻撃した時、追撃可能なら自分の攻撃の直後に追撃を行う
        UNIT_CAN_MAKE_FOLLOW_UP_ATTACK_BEFORE_FOES_NEXT_ATTACK_NODE,
    ));
}
{
    let skillId = getSpecialRefinementSkillId(Weapon.TalreganAxe);
    // 【再移動(残り+1)】を発動可能
    enablesCantoRemPlus(skillId, 1);
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // ターン開始時、周囲3マス以内に射程1の味方がいる時、自分と周囲3マス以内の射程1の味方の攻撃、速さ+6、「移動+1』(重複しない)、【見切り・追撃効果】を付与(1ターン)
        IF_NODE(new IsTargetWithinNSpacesOfTargetsAllyNode(3, new IsTargetMeleeWeaponNode()),
            new ForEachTargetAndTargetsAllyWithinNSpacesOfTargetNode(3, new IsTargetMeleeWeaponNode(),
                new GrantsStatsPlusAtStartOfTurnNode(6, 6, 0, 0),
                new GrantsStatusEffectsAtStartOfTurnNode(StatusEffectType.MobilityIncreased),
                new GrantsStatusEffectsAtStartOfTurnNode(StatusEffectType.NullFollowUp),
            ),
        ),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // 戦闘開始時、自身のHPが25%以上なら、戦闘中、攻撃、速さ+6、ダメージ+速さの20％(範囲奥義を除く)
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE(
            new GrantsStatsPlusToTargetDuringCombatNode(6, 6, 0, 0),
            new AppliesSkillEffectsAfterStatusFixedNode(
                new UnitDealsDamageExcludingAoeSpecialsNode(PERCENTAGE_NODE(20, UNITS_SPD_DURING_COMBAT_NODE)),
            ),
        ),
    ));
}

// 強化反転の槍+
{
    let setSkill = skillId => {
        AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
            // If unit initiates combat or is within 2 spaces of an ally,
            IF_UNIT_INITIATES_COMBAT_OR_IS_WITHIN_2_SPACES_OF_AN_ALLY(
                // grants Atk/Spd/Def/Res+4 to unit during combat and
                GRANTS_ALL_STATS_PLUS_4_TO_UNIT_DURING_COMBAT_NODE,
                // inflicts penalty on foe's Atk/Spd/Def/Res during combat = current bonus on each of foe's stats × 2
                // (calculates each stat penalty independently; example: if foe has +7 bonus to Atk, inflicts Atk-14, for a net penalty of Atk-7).
                new InflictsBonusReversalPenaltyOnTargetsFoeNode(true, true, true, true),
            ),
        ));
    };
    setSkill(Weapon.ReversalLancePlus);
    setSkill(Weapon.Reversalaxeplus);
}

// 獰猛かつ残忍
{
    let skillId = PassiveB.BrutalFerocity;
    // Effect:【Pathfinder】
    setPathfinder(skillId);

    // At start of turn, and after unit acts (if Canto triggers, after Canto), inflicts Atk/Def-7 and 【Gravity】on foes in cardinal directions of unit with HP < unit's max HP through their next actions.
    let nodeFunc = () => new SkillEffectNode(
        new ForEachUnitOnMapNode(AND_NODE(
                ARE_TARGET_AND_SKILL_OWNER_IN_DIFFERENT_GROUP_NODE,
                new IsTargetInCardinalDirectionsOfSkillOwnerNode(),
                LT_NODE(new TargetsHpOnMapNode(), new SkillOwnerMaxHpNode())
            ),
            new InflictsStatsMinusOnTargetOnMapNode(7, 0, 7, 0),
            new InflictsStatusEffectsOnTargetOnMapNode(StatusEffectType.Gravity),
        ),
    );
    AT_START_OF_TURN_HOOKS.addSkill(skillId, nodeFunc);
    AFTER_UNIT_ACTS_IF_CANTO_TRIGGERS_AFTER_CANTO_HOOKS.addSkill(skillId, nodeFunc);

    HAS_DIVINE_VEIN_SKILLS_WHEN_ACTION_DONE_HOOKS.addSkill(skillId, () => new IsTargetsFoeInCardinalDirectionsOfTargetNode());

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If foe initiates combat or if unit's HP ≥ 25% at start of combat,
        IF_NODE(OR_NODE(DOES_FOE_INITIATE_COMBAT_NODE, IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE),
            new NumThatIsNode(
                // inflicts penalty on foe's Atk/Def = 5 + unit's max HP - foe's HP at start of combat (min 8,
                // max 18),
                new InflictsStatsMinusOnFoeDuringCombatNode(READ_NUM_NODE, 0, READ_NUM_NODE, 0),
                new EnsureMinMaxNode(
                    ADD_NODE(5, SUB_NODE(new TargetsMaxHpNode(), new FoesHpAtStartOfCombatNode())), 8, 18,
                ),
            ),
            // unit makes a guaranteed follow-up attack,
            UNIT_MAKES_GUARANTEED_FOLLOW_UP_ATTACK_NODE,
            // neutralizes effects that inflict "Special cooldown charge -X" on unit,
            NEUTRALIZES_EFFECTS_THAT_INFLICT_SPECIAL_COOLDOWN_CHARGE_MINUS_X_ON_UNIT,
            // and reduces the percentage of foe's non-Special "reduce damage by X%" skills by 50% during combat (excluding area-of-effect Specials).
            REDUCES_PERCENTAGE_OF_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE,
        ),
    ));
}

// 魔器・ヨトゥンの斧
{
    let skillId = Weapon.ArcaneGiantAxe;
    // Accelerates Special trigger (cooldown count-1).

    // At start of player phase or enemy phase, neutralizes【Panic】and penalties on unit's Atk/Def that take effect on unit at that time.
    let nodeFunc = () => new SkillEffectNode(
        new AtStartOfPlayerPhaseOrEnemyPhaseNeutralizesStatusEffectThatTakeEffectOnTargetAtThatTimeNode(StatusEffectType.Panic),
        new AtStartOfPlayerPhaseOrEnemyPhaseNeutralizesPenaltiesThatTakeEffectOnTargetAtThatTimeNode(true, false, true, false),
    );
    AT_START_OF_TURN_HOOKS.addSkill(skillId, nodeFunc);
    AT_START_OF_ENEMY_PHASE_HOOKS.addSkill(skillId, nodeFunc);

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If foe initiates combat or if unit's HP ≥ 25% at start of combat,
        IF_NODE(OR_NODE(DOES_FOE_INITIATE_COMBAT_NODE, IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE),
            // grants bonus to unit's Atk/Spd/Def/Res = 25% of foe's Atk at start of combat - 4 (max 14; min 5),
            new GrantsAllStatsPlusNToTargetDuringCombatNode(
                new EnsureMinMaxNode(
                    SUB_NODE(PERCENTAGE_NODE(25, FOES_ATK_AT_START_OF_COMBAT_NODE), -4),
                    5,
                    14,
                )
            ),
            new AppliesSkillEffectsAfterStatusFixedNode(
                // deals damage = 15% of unit's Atk (including when dealing damage with an area-of-effect Special),
                new UnitDealsDamageExcludingAoeSpecialsNode(PERCENTAGE_NODE(15, UNITS_ATK_DURING_COMBAT_NODE)),
                // reduces damage from foe's attacks by 15% of unit's Atk (including from area-of-effect Specials; excluding Røkkr area-of-effect Specials),
                new ReducesDamageFromTargetsFoesAttacksByXDuringCombatNode(PERCENTAGE_NODE(15, UNITS_ATK_DURING_COMBAT_NODE)),
            ),
            // and grants Special cooldown count-1 to unit before unit's first attack during combat.
            new GrantsSpecialCooldownCountMinusNToTargetBeforeTargetsFirstAttackDuringCombatNode(1),
        ),
    ));

    BEFORE_AOE_SPECIAL_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        IF_NODE(OR_NODE(DOES_FOE_INITIATE_COMBAT_NODE, IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE),
            new UnitDealsDamageBeforeCombatNode(PERCENTAGE_NODE(15, UNITS_ATK_AT_START_OF_COMBAT_NODE)),
            new ReducesDamageBeforeCombatNode(PERCENTAGE_NODE(15, UNITS_ATK_AT_START_OF_COMBAT_NODE)),
        ),
    ));
}

// 天与の魔才
{
    let skillId = Special.GiftForMagic;
    // Before combat this unit initiates, foes in an area near target take damage equal to (unit's Atk minus foe's Def or Res).
    RANGED_ATTACK_SPECIAL_SET.add(skillId);
    RANGED_ATTACK_SPECIAL_DAMAGE_RATE_MAP.set(skillId, 1);

    // 十字範囲
    AOE_SPECIAL_SPACES_HOOKS.addSkill(skillId, () =>
        new CrossSpacesNode(),
    );

    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode());
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // Disables unit's and foe's skills that change attack priority.
        UNIT_DISABLES_SKILLS_THAT_CHANGE_ATTACK_PRIORITY,
        // If unit's Special is triggered before combat,
        IF_NODE(new IsTargetsSpecialTriggeredBeforeCombatNode(),
            // reduces the percentage of foe's non-Special "reduce damage by X%" skills by 50% during combat (excluding area-of-effect Specials).
            REDUCES_PERCENTAGE_OF_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE,
        )
    ));

    AT_APPLYING_ONCE_PER_COMBAT_DAMAGE_REDUCTION_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit's or foe's Special is ready or triggered before or during this combat,
        IF_NODE(IS_THE_UNITS_OR_FOES_SPECIAL_READY_OR_WAS_THE_UNITS_OR_FOES_SPECIAL_TRIGGERED_BEFORE_OR_DURING_THIS_COMBAT,
            // reduces damage from foe's next attack by 40% (once per combat; excluding area-of-effect Specials).
            new ReducesDamageFromTargetsFoesNextAttackByNPercentOncePerCombatNode(40),
        ),
    ));
}

// 魔器・業火の理書
{
    let skillId = Weapon.ArcaneTruthfire;
    // Accelerates Special trigger (cooldown count-1).
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of turn,
        // if unit's HP ≥ 25%,
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_TURN_NODE(
            // grants Atk+6 and the following status to unit for 1 turn: "Unit can move to a space adjacent to any ally within 2 spaces."
            new GrantsStatsPlusAtStartOfTurnNode(6, 0, 0, 0),
            new GrantsStatusEffectsAtStartOfTurnNode(StatusEffectType.AirOrders),
        ),
    ));

    BEFORE_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit initiates combat with HP ≥ 25% and unit has an area-of-effect Special equipped,
        IF_NODE(AND_NODE(
                DOES_UNIT_INITIATE_COMBAT_NODE,
                IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE,
                new HasTargetAoeSpecialNode()),
            // grants Special cooldown count-1 to unit before Special triggers before combat.
            new GrantsSpecialCooldownCountMinusNToTargetBeforeSpecialTriggersBeforeCombatNode(1),
        )
    ));

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of combat,
        // if unit's HP ≥ 25%,
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_TURN_NODE(
            // grants bonus to unit's Atk/Spd/Def/Res = 25% of foe's Atk at start of combat - 4 (min 5, max 14),
            new GrantsAllStatsPlusNToTargetDuringCombatNode(
                new EnsureMinMaxNode(
                    SUB_NODE(PERCENTAGE_NODE(25, FOES_ATK_AT_START_OF_COMBAT_NODE), -4),
                    5,
                    14,
                )
            ),
            new AppliesSkillEffectsAfterStatusFixedNode(
                // deals damage = 15% of unit's Atk (including when dealing damage with an area-of-effect Special),
                new UnitDealsDamageExcludingAoeSpecialsNode(PERCENTAGE_NODE(15, UNITS_ATK_DURING_COMBAT_NODE)),
            ),
            // and reduces damage from foe's first attack by 7 during combat ("first attack" normally means only the first strike; for effects that grant "unit attacks twice," it means the first and second strikes),
            new ReducesDamageFromFoesFirstAttackByNDuringCombatIncludingTwiceNode(7),
            // and also if unit's attack can trigger unit's Special (excluding area-of-effect Specials),
            IF_NODE(CAN_UNITS_ATTACK_TRIGGER_SPECIAL_NODE,
                // grants Special cooldown count-1 to unit before unit's first attack during combat.
                new GrantsSpecialCooldownCountMinusNToTargetBeforeTargetsFirstAttackDuringCombatNode(1),
            ),
        ),
    ));

    BEFORE_AOE_SPECIAL_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE(
            // deals damage = 15% of unit's Atk (including when dealing damage with an area-of-effect Special),
            new UnitDealsDamageBeforeCombatNode(PERCENTAGE_NODE(15, UNITS_ATK_AT_START_OF_COMBAT_NODE)),
        ),
    ));
}

// 強化増幅の剣+
{
    let skillId = Weapon.DoublerSwordPlus;
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of turn,
        // if unit is within 2 spaces of an ally,
        // grants Atk/Def+6 to unit and allies within 2 spaces of unit for 1 turn.
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit initiates combat or is within 2 spaces of an ally,
        IF_UNIT_INITIATES_COMBAT_OR_IS_WITHIN_2_SPACES_OF_AN_ALLY(
            // grants Atk/Spd/Def/Res+X to unit during combat
            // (X = 4 + highest bonus on each stat between unit and allies within 2 spaces of unit; calculates each stat bonus independently).
            new GrantsStatsPlusToTargetDuringCombatNode(
                4, 4, 4, 4
            ),
            new GrantsStatsPlusToTargetDuringCombatNode(
                HIGHEST_BONUS_ON_EACH_STAT_BETWEEN_TARGET_AND_TARGET_ALLIES_WITHIN_N_SPACES_NODE(2)
            ),
        )
    ));
}

// エトルリアの光
{
    let skillId = Weapon.LightOfEtruria;
    // Grants Res+3.

    let nodeFunc = () => new SkillEffectNode(
        // At start of player phase or enemy phase,
        // to unit and allies within 2 spaces of unit for 1 turn,
        new ForEachTargetAndTargetsAllyWithin2SpacesOfTargetNode(
            // grants Spd/Res+6 and【Hexblade】
            new GrantsStatsPlusAtStartOfTurnNode(0, 6, 0, 6),
            new GrantsStatusEffectsAtStartOfTurnNode(StatusEffectType.Hexblade),
        ),
        // and also,
        new ForEachUnitNode(new TargetsFoesOnMapNode(),
            // if any foes within 3 rows or 3 columns centered on unit have Res < unit's Res+5,
            AND_NODE(
                IS_TARGET_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_SKILL_OWNER_NODE,
                LT_NODE(TARGETS_EVAL_RES_ON_MAP, ADD_NODE(SKILL_OWNERS_EVAL_RES_ON_MAP, 5)),
            ),
            // inflicts Atk/Spd-7,【Guard】,
            new InflictsStatsMinusAtStartOfTurnNode(7, 7, 0, 0),
            // and 【Exposure】on those foes through their next actions.
            new InflictsStatusEffectsAtStartOfTurnNode(StatusEffectType.Guard),
            new InflictsStatusEffectsAtStartOfTurnNode(StatusEffectType.Exposure),
        ),
    );
    AT_START_OF_TURN_HOOKS.addSkill(skillId, nodeFunc);
    AT_START_OF_ENEMY_PHASE_HOOKS.addSkill(skillId, nodeFunc);

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If foe initiates combat,
        IF_NODE(DOES_FOE_INITIATE_COMBAT_NODE,
            new NumThatIsNode(
                // inflicts penalty on foe's Atk/Spd during combat = 6 + 20% of unit's Res at start of combat,
                new InflictsStatsMinusOnFoeDuringCombatNode(READ_NUM_NODE, READ_NUM_NODE, 0, 0),
                ADD_NODE(6, PERCENTAGE_NODE(20, UNITS_RES_AT_START_OF_COMBAT_NODE)),
            ),
            // and also,
            // if unit's HP > 1 and foe would reduce unit's HP to 0,
            // unit survives with 1 HP (once per combat; does not stack with non-Special effects that allow unit to survive with 1 HP if foe's attack would reduce HP to 0).
            new TargetCanActivateNonSpecialMiracleNode(100),
        )
    ));
}

// 比翼ルキナ
{
    WHEN_TRIGGERS_DUO_OR_HARMONIZED_EFFECT_HOOKS_MAP.addValue(Hero.DuoLucina,
        new SkillEffectNode(
            new GrantsAnotherActionToTargetOnMapNode(),
            new ReEnablesCantoToTargetOnMapNode(),
        )
    );

    CAN_TRIGGER_DUO_OR_HARMONIZED_EFFECT_HOOKS_MAP.addValue(Hero.DuoLucina,
        HAS_TARGET_ENTERED_COMBAT_DURING_CURRENT_TURN_NODE,
    );
}

// 看破
{
    let setSkill = (skillId, statsFlags) => {
        let nodeFunc = () => new SkillEffectNode(
            // If a movement Assist skill (like Reposition, Shove, Pivot, etc.) is used by unit or targets unit,
            // inflicts【Exposure】on closest foes within 5 spaces of both unit and target ally or unit and targeting ally after movement and foes within 2 spaces of those foes through their next actions.
            new ForEachUnitNode(
                CLOSEST_FOES_WITHIN_5_SPACES_OF_BOTH_ASSIST_TARGETING_AND_ASSIST_TARGET_AND_FOES_WITHIN_2_SPACES_OF_THOSE_FOES_NODE,
                TRUE_NODE,
                new InflictsStatusEffectsOnTargetOnMapNode(StatusEffectType.Exposure),
            ),
        );
        AFTER_MOVEMENT_SKILL_IS_USED_BY_UNIT_HOOKS.addSkill(skillId, nodeFunc)
        AFTER_MOVEMENT_SKILL_IS_USED_BY_ALLY_HOOKS.addSkill(skillId, nodeFunc)

        // noinspection JSCheckFunctionSignatures
        FOR_FOES_INFLICTS_STATS_MINUS_HOOKS.addSkill(skillId, () => new SkillEffectNode(
            // on the map with the 【Exposure】effect active and
            IF_NODE(new HasTargetStatusEffectNode(StatusEffectType.Exposure),
                // Inflicts Spd/Def-5 on foes
                new InflictsStatsMinusOnFoeDuringCombatNode(...statsFlags.map(f => f ? 5 : 0)),
            ),
        ));

        FOR_FOES_INFLICTS_EFFECTS_HOOKS.addSkill(skillId, () => new SkillEffectNode(
            // on the map with the 【Exposure】effect active and
            IF_NODE(new HasTargetStatusEffectNode(StatusEffectType.Exposure),
                // neutralizes bonuses to Spd/Def for those foes during combat.
                new NeutralizesFoesBonusesToStatsDuringCombatNode(...statsFlags),
            ),
        ));

        // noinspection JSCheckFunctionSignatures
        AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
            // Inflicts Spd/Def-4 on foe during combat.
            new InflictsStatsMinusOnFoeDuringCombatNode(...statsFlags.map(f => f ? 4 : 0)),
        ));
    };
    setSkill(PassiveB.AtkResDetect, [true, false, false, true]);
    setSkill(PassiveB.SpdDefDetect, [false, true, true, false]);
}

// 赤の呪い
{
    let skillId = getStatusEffectSkillId(StatusEffectType.Anathema);
    FOR_FOES_INFLICTS_STATS_MINUS_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_SKILL_OWNER_NODE,
            // Inflicts Spd/Def/Res-4 on foes within 3 spaces of unit during combat.
            new InflictsStatsMinusOnTargetDuringCombatNode(0, 4, 4, 4),
        ),
    ));
}

// 未来を知るもの
{
    let skillId = getStatusEffectSkillId(StatusEffectType.FutureWitness);
    // Enables【Canto (２)】.
    enablesCantoN(skillId, 2);

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // Grants Atk/Spd/Def/Res+5 to unit and
        GRANTS_ALL_STATS_PLUS_5_TO_UNIT_DURING_COMBAT_NODE,
        // reduces damage from foe's first attack by 7 during combat
        // ("first attack" normally means only the first strike; for effects that grant "unit attacks twice," it means the first and second strikes),
        new ReducesDamageFromFoesFirstAttackByNDuringCombatIncludingTwiceNode(7),
        // and also,
        // if unit initiates combat and foe's attack can trigger foe's Special,
        IF_NODE(AND_NODE(DOES_UNIT_INITIATE_COMBAT_NODE, CAN_FOES_ATTACK_TRIGGER_FOES_SPECIAL_NODE),
            // inflicts Special cooldown count+1 on foe before foe's first attack during combat (cannot exceed the foe's maximum Special cooldown).
            INFLICTS_SPECIAL_COOLDOWN_COUNT_PLUS_N_ON_TARGETS_FOE_BEFORE_TARGETS_FOES_FIRST_ATTACK_NODE(1),
        ),
    ));
}

// 未来を叶える瞳
{
    let skillId = Support.FutureFocus;
    // Unit and target ally swap spaces.
    SWAP_ASSIST_SET.add(skillId);

    AFTER_MOVEMENT_SKILL_IS_USED_BY_UNIT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        new TargetsOncePerTurnSkillEffectNode(`${skillId}-周囲への効果`,
            new ForEachUnitNode(ALLIES_WITHIN_N_SPACES_OF_BOTH_ASSIST_UNIT_AND_TARGET(2), TRUE_NODE,
                // Grants 【Future Witness】and【Null Follow-Up】to allies within 2 spaces of both unit and target after movement for 1 turn (including unit and target),
                new GrantsStatusEffectsOnTargetOnMapNode(StatusEffectType.FutureWitness),
                new GrantsStatusEffectsOnTargetOnMapNode(StatusEffectType.NullFollowUp),
                // grants Special cooldown-1 to unit and those allies,
                new GrantsSpecialCooldownCountMinusOnTargetOnMapNode(1),
            )
        ),
    ));

    // and grants another action to unit (once per turn).
    AFTER_MOVEMENT_ASSIST_ENDED_BY_UNIT_HOOKS.addSkill(skillId, () => new GrantsAnotherActionToTargetOnAssistNode());
}

// 聖王国の父娘の忍弓
{
    let skillId = Weapon.YlisseNinjaBow;
    // Accelerates Special trigger (cooldown count-1).
    // Effective against flying foes.
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // Unit attacks twice (even if foe initiates combat, unit attacks twice).
        TARGET_ATTACKS_TWICE_WHEN_TARGET_INITIATES_COMBAT_NODE,
        TARGET_ATTACKS_TWICE_WHEN_TARGETS_FOE_INITIATES_COMBAT_NODE,
        // If unit initiates combat or is within 2 spaces of an ally,
        IF_UNIT_INITIATES_COMBAT_OR_IS_WITHIN_2_SPACES_OF_AN_ALLY(
            // grants bonus to unit's Atk/Spd/Def/Res = 15% of unit's Spd at start of combat + 5,
            new GrantsAllStatsPlusNToTargetDuringCombatNode(
                ADD_NODE(PERCENTAGE_NODE(15, UNITS_SPD_AT_START_OF_COMBAT_NODE), 5),
            ),
            // unit deals +X × 5 damage (max 25; X = number of【Bonus】effects active on unit,
            // excluding stat bonuses + number of【Penalty】effects active on foe,
            // excluding stat penalties; excluding area-of-effect Specials),
            new UnitDealsDamageExcludingAoeSpecialsNode(
                new EnsureMaxNode(
                    MULT_NODE(NUM_OF_BONUS_ON_UNIT_PLUS_NUM_OF_PENALTY_ON_FOE_EXCLUDING_STAT_NODE, 5),
                    25,
                ),
            ),
            // reduces the percentage of foe's non-Special "reduce damage by X%" skills by 50% (excluding area-of-effect Specials),
            REDUCES_PERCENTAGE_OF_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE,
            // and neutralizes effects that inflict "Special cooldown charge -X" on unit during combat,
            NEUTRALIZES_EFFECTS_THAT_INFLICT_SPECIAL_COOLDOWN_CHARGE_MINUS_X_ON_UNIT,
            // and also,
            // if unit's attack can trigger unit's Special,
            IF_NODE(CAN_UNITS_ATTACK_TRIGGER_SPECIAL_NODE,
                // grants Special cooldown count-1 to unit after first Special trigger per combat (excluding area-of-effect Specials).
                new GrantsSpecialCooldownCountMinusNToTargetAfterFirstSpecialTriggerPerCombatNode(1),
            ),
        ),
    ));
}

// 刃壁
{
    setSpikedWall(PassiveB.ASSpikedWall, [4, 4, 0, 0], [UNITS_ATK_DURING_COMBAT_NODE]);
    setSpikedWall(PassiveB.ADSpikedWall, [4, 0, 4, 0], [UNITS_DEF_DURING_COMBAT_NODE, UNITS_RES_DURING_COMBAT_NODE]);
    setSpikedWall(PassiveB.SDSpikedWall, [0, 4, 4, 0], [UNITS_SPD_DURING_COMBAT_NODE, UNITS_DEF_DURING_COMBAT_NODE]);
    setSpikedWall(PassiveB.SRSpikedWall, [0, 4, 0, 4], [UNITS_SPD_DURING_COMBAT_NODE, UNITS_RES_DURING_COMBAT_NODE]);
}

// 巨岩
{
    let skillId = Special.Boulder;
    // 通常攻撃奥義(範囲奥義・疾風迅雷などは除く)
    NORMAL_ATTACK_SPECIAL_SET.add(skillId);

    // 奥義カウント設定(ダメージ計算機で使用。奥義カウント2-4の奥義を設定)
    setSpecialCount(skillId, 3)

    // Boosts Special damage by 50% of unit's Def when Special triggers.
    WHEN_APPLIES_SPECIAL_EFFECTS_AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        new BoostsDamageWhenSpecialTriggersNode(
            MULT_TRUNC_NODE(0.5, UNITS_DEF_DURING_COMBAT_NODE),
        ),
    ));

    AT_APPLYING_ONCE_PER_COMBAT_DAMAGE_REDUCTION_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        IF_NODE(
            AND_NODE(
                // If unit's or foe's Special is ready,
                // or unit's or foe's Special triggered before or during this combat,
                IS_THE_UNITS_OR_FOES_SPECIAL_READY_OR_WAS_THE_UNITS_OR_FOES_SPECIAL_TRIGGERED_BEFORE_OR_DURING_THIS_COMBAT,
                // and also,
                // if unit's Def ≥ foe's Def-4 during combat,
                GTE_NODE(UNITS_EVAL_DEF_DURING_COMBAT_NODE, SUB_NODE(FOES_EVAL_DEF_DURING_COMBAT_NODE, 4)),
            ),
            // reduces damage from foe's next attack by 40% (once per combat; excluding area-of-effect Specials).
            new ReducesDamageFromTargetsFoesNextAttackByNPercentOncePerCombatNode(40),
        ),
    ));
}

// 武と勇の鎖鎌
{
    let skillId = Weapon.BoldKusarigama;
    // Accelerates Special trigger (cooldown count-1).

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // Unit attacks twice (even if foe initiates combat, unit attacks twice).
        TARGET_ATTACKS_TWICE_WHEN_TARGET_INITIATES_COMBAT_NODE,
        TARGET_ATTACKS_TWICE_WHEN_TARGETS_FOE_INITIATES_COMBAT_NODE,
        // If unit initiates combat or is within 2 spaces of an ally,
        IF_UNIT_INITIATES_COMBAT_OR_IS_WITHIN_2_SPACES_OF_AN_ALLY(
            // grants bonus to unit's Atk/Spd/Def/Res = 15% of unit's Def at start of combat + 5,
            new GrantsAllStatsPlusNToTargetDuringCombatNode(
                ADD_NODE(MULT_TRUNC_NODE(0.15, UNITS_DEF_AT_START_OF_COMBAT_NODE), 5),
            ),
            new AppliesSkillEffectsAfterStatusFixedNode(
                // deals damage = 25% of unit's Def (excluding area-of-effect Specials),
                new UnitDealsDamageExcludingAoeSpecialsNode(MULT_TRUNC_NODE(0.25, UNITS_DEF_DURING_COMBAT_NODE)),
                // reduces damage from foe's attacks by 25% of unit's Def (including from area-of-effect Specials; excluding Røkkr area-of-effect Specials),
                new ReducesDamageExcludingAoeSpecialsNode(MULT_TRUNC_NODE(0.25, UNITS_DEF_DURING_COMBAT_NODE)),
            ),
            // neutralizes "reduces damage by X%" effects from unit's and foe's non-Special skills (excluding area-of-effect Specials),
            NEUTRALIZE_REDUCES_DAMAGE_BY_X_PERCENT_EFFECTS_FROM_UNITS_NON_SPECIAL_NODE,
            NEUTRALIZE_REDUCES_DAMAGE_BY_X_PERCENT_EFFECTS_FROM_FOES_NON_SPECIAL_NODE,
            // neutralizes effects that guarantee unit's and foe's follow-up attacks,
            UNIT_NEUTRALIZES_EFFECTS_THAT_GUARANTEE_FOES_FOLLOW_UP_ATTACKS_DURING_COMBAT_NODE,
            FOE_NEUTRALIZES_EFFECTS_THAT_GUARANTEE_UNITS_FOLLOW_UP_ATTACKS_DURING_COMBAT_NODE,
            // and increases the Spd difference necessary for unit or foe to make a follow-up attack by 20 during combat (Spd must be ≥ 25 to make a follow-up attack; stacks with similar skills).
            new IncreasesSpdDiffNecessaryForTargetToMakeFollowUpNode(20),
            new IncreasesSpdDiffNecessaryForFoeToMakeFollowUpNode(20),
        ),
        // If unit initiates combat,
        IF_NODE(DOES_UNIT_INITIATE_COMBAT_NODE,
            // grants Special cooldown count-1 to unit before unit's first attack during combat.
            new GrantsSpecialCooldownCountMinusNToTargetBeforeTargetsFirstAttackDuringCombatNode(1),
        ),
    ));

    // reduces damage from foe's attacks by 25% of unit's Def (including from area-of-effect Specials; excluding Røkkr area-of-effect Specials),
    BEFORE_AOE_SPECIAL_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        IF_UNIT_INITIATES_COMBAT_OR_IS_WITHIN_2_SPACES_OF_AN_ALLY(
            new ReducesDamageByAoeNode(
                MULT_TRUNC_NODE(0.25, UNITS_DEF_AT_START_OF_COMBAT_NODE),
            ),
        ),
    ));
}

// 花と茶の忍法帳
{
    let skillId = Weapon.ScrollOfTeas;
    // Accelerates Special trigger (cooldown count-1).
    // Unit attacks twice (even if foe initiates combat, unit attacks twice).

    // Unit can move to any space within 2 spaces of an ally within 2 spaces of unit.
    setSkillThatUnitCanMoveToAnySpaceWithinNSpacesOfAnAllyWithinMSpacesOfUnit(skillId, 2, 2);

    // At start of enemy phase,
    AT_START_OF_ENEMY_PHASE_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // restores 10 HP to unit and allies within 3 spaces of unit.
        new ForEachTargetAndTargetsAllyWithinNSpacesOfTargetNode(3, TRUE_NODE,
            new RestoreTargetsHpOnMapNode(10),
        ),
    ));

    // After start-of-turn effects trigger on enemy phase,
    AFTER_START_OF_TURN_EFFECTS_TRIGGER_ON_ENEMY_PHASE_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // for unit and allies within 3 spaces of unit,
        new ForEachTargetAndTargetsAllyWithinNSpacesOfTargetNode(3, TRUE_NODE,
            // neutralizes stat penalties and
            NEUTRALIZES_TARGETS_ALL_STAT_PENALTIES_NODE,
            // two【Penalty】 effects (does not apply to Penalty effects that are applied at the same time; neutralizes the first applicable Penalty effects on unit's list of active effects).
            new NeutralizesTargetsNPenaltyEffectsNode(2),
        ),
    ));

    // Grants Spd/Res+4 to allies within 3 spaces of unit during their combat and
    FOR_ALLIES_GRANTS_STATS_PLUS_TO_ALLIES_DURING_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_SKILL_OWNER_NODE,
            new GrantsStatsPlusToTargetDuringCombatNode(0, 4, 0, 4),
        ),
    ));

    // to allies within 3 spaces of unit during their combat and
    FOR_ALLIES_GRANTS_EFFECTS_TO_ALLIES_AFTER_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_SKILL_OWNER_NODE,
            // restores 10 HP to those allies after their combat.
            RESTORES_10_HP_TO_UNIT_AFTER_COMBAT_NODE,
        ),
    ));

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        TARGET_ATTACKS_TWICE_WHEN_TARGET_INITIATES_COMBAT_NODE,
        TARGET_ATTACKS_TWICE_WHEN_TARGETS_FOE_INITIATES_COMBAT_NODE,
        // If unit initiates combat or is within 3 spaces of an ally,
        IF_NODE(OR_NODE(DOES_UNIT_INITIATE_COMBAT_NODE, IS_TARGET_WITHIN_3_SPACES_OF_TARGETS_ALLY_NODE),
            // grants bonus to unit's Atk/Spd/Def/Res = 15% of unit's Spd at start of combat + 5,
            new GrantsAllStatsPlusNToTargetDuringCombatNode(
                ADD_NODE(MULT_TRUNC_NODE(0.15, UNITS_SPD_AT_START_OF_COMBAT_NODE), 5),
            ),
            // deals damage = 6 × number of allies with HP ≥ 50% during combat (max 18; excluding area-of-effect Specials),
            new UnitDealsDamageExcludingAoeSpecialsNode(
                new EnsureMaxNode(
                    MULT_NODE(
                        6,
                        new NumOfTargetsAlliesWithinNSpacesNode(99,
                            GTE_NODE(new TargetsHpPercentageAtStartOfCombatNode(), 50))
                    ),
                    18,
                ),
            ),
            // and restores 10 HP to unit after combat.
            RESTORES_10_HP_TO_UNIT_AFTER_COMBAT_NODE,
        ),
    ));
}

// 掩撃
{
    // 鬼神飛燕の掩撃
    setSlyEffect(PassiveA.SlySwiftSparrow, 8, 8, 0, 0);
    // 鬼神金剛の掩撃
    setSlyEffect(PassiveA.SlySturdyBlow, 8, 0, 10, 0);
    // 鬼神明鏡の掩撃
    setSlyEffect(PassiveA.SlyMirror, 8, 0, 0, 10);
}

// 呪い忍者の忍法帳
{
    let skillId = Weapon.ScrollOfCurses;
    // Accelerates Special trigger (cooldown count-1).
    // Enables【Canto (Dist.; Max ３)】.
    enablesCantoDist(skillId, 0, 3);

    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of turn,
        // if unit's HP ≥ 25%,
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_TURN_NODE(
            // to unit and allies within 2 spaces for 1 turn:
            new ForEachTargetAndTargetsAllyWithin2SpacesOfTargetNode(TRUE_NODE,
                // grants Atk/Spd+6,
                new GrantsStatsPlusAtStartOfTurnNode(6, 6, 0, 0),
                // 【Anathema】,
                new GrantsStatusEffectsAtStartOfTurnNode(StatusEffectType.Anathema),
                // and the following status
                // "Grants Special cooldown charge +1 per attack during combat (only highest value applied; does not stack)."
                new GrantsStatusEffectsAtStartOfTurnNode(StatusEffectType.SpecialCooldownChargePlusOnePerAttack),
            ),
        ),
    ));

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit initiates combat,
        IF_NODE(DOES_UNIT_INITIATE_COMBAT_NODE,
            // unit attacks twice,
            TARGET_ATTACKS_TWICE_WHEN_TARGET_INITIATES_COMBAT_NODE,
            // and unit can make a follow-up attack before foe can counterattack.
            UNIT_CAN_MAKE_FOLLOW_UP_ATTACK_BEFORE_FOES_NEXT_ATTACK_NODE,
        ),

        // If unit initiates combat or if foe's HP ≥ 75% at start of combat,
        IF_NODE(OR_NODE(DOES_UNIT_INITIATE_COMBAT_NODE, IS_FOES_HP_GTE_75_PERCENT_AT_START_OF_COMBAT_NODE),
            // grants bonus to unit's Atk/Spd during combat = 6 + 20% of unit's Spd at start of combat.
            X_NUM_NODE(
                new GrantsStatsPlusToTargetDuringCombatNode(READ_NUM_NODE, READ_NUM_NODE, 0, 0),
                ADD_NODE(6, MULT_TRUNC_NODE(0.2, UNITS_SPD_AT_START_OF_COMBAT_NODE)),
            ),
        )
    ));
}

// 神獣の鋭爪
{
    let skillId = PassiveC.DivineTalon;

    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of turn,
        new ForEachTargetAndTargetsAllyWithin2SpacesOfTargetNode(TRUE_NODE,
            // neutralizes any【Penalty】 effects on unit and allies within 2 spaces of unit (excluding penalties inflicted at the start of the same turn),
            NEUTRALIZES_ANY_PENALTY_ON_TARGET_NODE,
            // and deals 1 damage to unit and allies within 2 spaces of unit.
            new DealsDamageToTargetAtStartOfTurnNode(1),
        ),
        // At start of turn,
        new ForEachTargetsAllyWithinNSpacesNode(2,
            // dragon, beast, infantry, and armored allies within 2 spaces of unit (that turn only; does not stack).
            OR_NODE(IS_TARGET_BEAST_OR_DRAGON_TYPE_NODE, IS_TARGET_INFANTRY_NODE, IS_TARGET_ARMOR_NODE),
            // grants "unit can move 1 extra space" to
            new GrantsStatusEffectsAtStartOfTurnNode(StatusEffectType.MobilityIncreased),
        )
    ));

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit is transformed or if foe's HP ≥ 75% at start of combat,
        IF_NODE(OR_NODE(DOES_UNIT_INITIATE_COMBAT_NODE, IS_FOES_HP_GTE_75_PERCENT_AT_START_OF_COMBAT_NODE),
            // grants Atk/Spd/Def/Res+5 to unit,
            GRANTS_ALL_STATS_PLUS_5_TO_UNIT_DURING_COMBAT_NODE,
            // neutralizes effects that guarantee foe's follow-up attacks and effects that prevent unit's follow-up attacks,
            NULL_UNIT_FOLLOW_UP_NODE,
            // neutralizes effects that inflict "Special cooldown charge -X" on unit,
            NEUTRALIZES_EFFECTS_THAT_INFLICT_SPECIAL_COOLDOWN_CHARGE_MINUS_X_ON_UNIT,
            new NumThatIsNode(
                // and reduces damage from foe's attacks by X during combat
                // and also,
                // when foe's attack triggers foe's Special,
                // reduces damage by X (excluding area-of-effect Specials).
                new SkillEffectNode(
                    new ReducesDamageFromTargetsFoesAttacksByXDuringCombatNode(READ_NUM_NODE),
                    new ReducesDamageWhenFoesSpecialExcludingAoeSpecialNode(READ_NUM_NODE),
                ),
                // (X = number of spaces from start position to end position of whoever initiated combat × 4; max 12),
                new EnsureMaxNode(
                    MULT_NODE(NUMBER_OF_SPACES_FROM_START_POSITION_TO_END_POSITION_OF_WHOEVER_INITIATED_COMBAT, 4),
                    12,
                ),
            ),
        ),
    ));
}

// 共栄
{
    // 攻撃速さの共栄
    setFortune(PassiveA.AtkSpdFortune, [false, true, true, false], [8, 8, 0, 0]);
    // 攻撃守備の共栄
    setFortune(PassiveA.AtkDefFortune, [true, false, true, false], [8, 0, 8, 0]);
    // 攻撃魔防の共栄
    setFortune(PassiveA.AtkResFortune, [true, false, true, false], [8, 0, 0, 8]);
    // 守備魔防の共栄
    setFortune(PassiveA.DefResFortune, [false, false, true, true], [0, 0, 8, 8]);
}

// 敏捷なる獣
{
    let skillId = Special.NimbleBeast;
    // 通常攻撃奥義(範囲奥義・疾風迅雷などは除く)
    NORMAL_ATTACK_SPECIAL_SET.add(skillId);

    // 奥義カウント設定(ダメージ計算機で使用。奥義カウント2-4の奥義を設定)
    setSpecialCount(skillId, 3)

    // Boosts damage by X% of unit's Spd when Special triggers (if transformed, X = 50; otherwise, X = 40).
    WHEN_APPLIES_SPECIAL_EFFECTS_AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        new BoostsDamageWhenSpecialTriggersNode(
            MULT_TRUNC_NODE(
                COND_OP(new IsTargetTransformedNode(), 0.5, 0.4),
                UNITS_SPD_DURING_COMBAT_NODE),
        ),
    ));

    AT_APPLYING_ONCE_PER_COMBAT_DAMAGE_REDUCTION_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If both of the following conditions are met, reduces damage from foe's next attack by 40% during combat:
        IF_NODE(
            AND_NODE(
                //   - Unit's or foe's Special is ready, or unit's
                //     or foe's Special triggered before or during
                //     this combat.
                IS_THE_UNITS_OR_FOES_SPECIAL_READY_OR_WAS_THE_UNITS_OR_FOES_SPECIAL_TRIGGERED_BEFORE_OR_DURING_THIS_COMBAT,
                //   - Unit is transformed or unit's Spd ≥ foe's
                //     Spd-4.
                // (Once per combat; excluding area-of-effect Specials).
                OR_NODE(
                    new IsTargetTransformedNode(),
                    GTE_NODE(UNITS_EVAL_SPD_DURING_COMBAT_NODE, SUB_NODE(FOES_EVAL_SPD_DURING_COMBAT_NODE, 4)),
                ),
            ),
            new ReducesDamageFromTargetsFoesNextAttackByNPercentOncePerCombatNode(40),
        ),
    ));
}

// 刃の葬り手の爪
{
    let skillId = Weapon.QuietingClaw;
    // Accelerates Special trigger (cooldown count-1).

    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of turn,
        // if unit's HP ≥ 25%,
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_TURN_NODE(
            // on nearest foe and foes within 2 spaces of them through their next actions.
            new ForEachTargetsClosestFoeAndAnyFoeWithin2SpacesOfThoseFoesNode(TRUE_NODE,
                // inflicts Spd/Def-7,
                new InflictsStatsMinusAtStartOfTurnNode(0, 7, 7, 0),
                // 【Exposure】,
                // and a penalty that neutralizes non-Special "if foe would reduce unit's HP to 0, unit survives with 1 HP" effects
                new InflictsStatusEffectsAtStartOfTurnNode(
                    StatusEffectType.Exposure,
                    StatusEffectType.NeutralizeUnitSurvivesWith1HP
                ),
            ),
        ),
    ));

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of combat,
        // if unit's HP ≥ 25%,
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE(
            // grants Atk/Spd/Def/Res+5 to unit and
            GRANTS_ALL_STATS_PLUS_5_TO_UNIT_DURING_COMBAT_NODE,
            new NumThatIsNode(
                // inflicts Atk/Spd/Def-X on foe
                new InflictsStatsMinusOnFoeDuringCombatNode(READ_NUM_NODE, READ_NUM_NODE, READ_NUM_NODE, 0),
                // (X = number of foes within 2 spaces of target with Bonuses or Penalties active on them,
                // excluding target, × 3, + 4; max 10),
                new EnsureMaxNode(
                    ADD_NODE(
                        MULT_NODE(
                            new NumOfTargetsAlliesWithinNSpacesNode(2, IS_BONUS_OR_PENALTY_ACTIVE_ON_TARGET_NODE),
                            3),
                        4),
                    10,
                ),
            ),
            // deals Y damage
            new UnitDealsDamageExcludingAoeSpecialsNode(
                // (Y = total number of Bonuses and Penalties active on foe and any foe within 2 spaces of foe,
                // excluding stat bonuses and stat penalties, x 3;
                MULT_NODE(TOTAL_NUMBER_OF_BONUSES_AND_PENALTIES_ACTIVE_ON_FOE_AND_ANY_FOE_WITHIN_N_SPACES_OF_FOE(2), 3),
                // excluding when dealing damage with an area-of-effect Special),
            ),
            // reduces damage from attacks by 40%,
            new ReducesDamageFromTargetsFoesAttacksByXPercentDuringCombatNode(40),
            // and reduces the percentage of foe's non-Special "reduce damage by X%" skills by 50% during combat.
            REDUCES_PERCENTAGE_OF_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE,
        ),
    ));

    // At start of turn,
    // if unit is adjacent to only beast or dragon allies or if unit is not adjacent to any ally,
    // unit transforms (otherwise,
    // unit reverts). If unit transforms,
    // unit can move 1 extra space (that turn only; does not stack) and grants Atk+2 to unit.
    setBeastSkill(skillId, BeastCommonSkillType.Flying);
}

// 始祖の炎翼
{
    let skillId = PassiveB.VedfolnirsWing;
    // Effect:【Pathfinder】
    setPathfinder(skillId);
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of turn,
        // if unit is on a team with only 1 support partner,
        IF_NODE(EQ_NODE(1, new CountUnitsNode(TARGETS_PARTNERS_ON_MAP_NODE)),
            FOR_EACH_UNIT_NODE(TARGETS_PARTNERS_ON_MAP_NODE,
                // grants【Pathfinder】to support partner for 1 turn.
                new GrantsStatusEffectsAtStartOfTurnNode(StatusEffectType.Pathfinder),
            ),
        ),

        // At start of turn,
        // if unit is not on a team with support partner and if there is only 1 ally who has the highest Def,
        IF_NODE(EQ_NODE(0, COUNT_UNITS_NODE(TARGETS_PARTNERS_ON_MAP_NODE)),
            IF_NODE(EQ_NODE(1, COUNT_UNITS_NODE(HIGHEST_STAT_TARGETS_ALLIES_ON_MAP_NODE(STATUS_INDEX.Def))),
                FOR_EACH_UNIT_NODE(HIGHEST_STAT_TARGETS_ALLIES_ON_MAP_NODE(STATUS_INDEX.Def),
                    // grants【Pathfinder】to that ally for 1 turn.
                    GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.Pathfinder),
                ),
            ),
        ),
    ));

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of combat,
        // if unit's HP ≥ 25%,
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE(
            // TODO: リファクタリング。それぞれの値について一括で設定できるようにする
            // inflicts penalty on foe's Atk/Spd/Def =
            // 5 + current bonus on each of foe's stats × 2
            new InflictsStatsMinusOnFoeDuringCombatNode(
                ADD_NODE(5, MULT_NODE(FOES_ATK_BONUS_NODE, 2)),
                ADD_NODE(5, MULT_NODE(FOES_SPD_BONUS_NODE, 2)),
                ADD_NODE(5, MULT_NODE(FOES_DEF_BONUS_NODE, 2)),
                0
            ),
            // (calculates each stat penalty independently; example: if foe has a +7 bonus to Atk, inflicts Atk-19, for a net penalty of Atk-12),

            // and reduces the percentage of foe's non-Special "reduce damage by X%" skills by 50% during combat (excluding area-of-effect Specials),
            REDUCES_PERCENTAGE_OF_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE,
            // and restores 7 HP to unit after combat.
            RESTORES_7_HP_TO_UNIT_AFTER_COMBAT_NODE,
        )
    ));
}

// 引き戻し・歩法
{
    let skillId = Support.RepositionGait;
    // Target ally moves to opposite side of unit.
    // If unit uses an Assist skill on the current turn, enables【Canto (１)】.
    CAN_TRIGGER_CANTO_HOOKS.addSkill(skillId, () => new HasTargetUsedAssistDuringCurrentTurnNode());
    CALCULATES_DISTANCE_OF_CANTO_HOOKS.addSkill(skillId, () => NumberNode.makeNumberNodeFrom(1));
}

// 始まりの巨人の剣
{
    let skillId = Weapon.VedfolnirsEdge;
    // Accelerates Special trigger (cooldown count-1).
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of turn,
        // if there is an ally within 3 rows or 3 columns centered on unit,
        IF_NODE(IS_THERE_ALLY_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_UNIT_NODE,
            FOR_EACH_UNIT_NODE(SKILL_OWNER_AND_SKILL_OWNERS_ALLIES_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_SKILL_OWNER_NODE,
                // grants Atk/Spd+6 and [Null Follow-Up) to unit and allies within 3 rows or 3 columns centered on unit for 1 turn.
                new GrantsStatsPlusAtStartOfTurnNode(6, 6, 0, 0),
                new GrantsStatusEffectsAtStartOfTurnNode(StatusEffectType.NullFollowUp),
            ),
        ),
    ));

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit initiates combat or if there is an ally within 3 rows or 3 columns centered on unit,
        IF_NODE(OR_NODE(DOES_UNIT_INITIATE_COMBAT_NODE, IS_THERE_ALLY_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_UNIT_NODE),
            // grants bonus to unit's
            // Atk/Spd/Def/Res = 5 + number of allies within 3 rows or 3 columns centered on unit x 3 (max 14),
            new GrantsAllStatsPlusNToTargetDuringCombatNode(
                new EnsureMaxNode(
                    ADD_NODE(5, MULT_NODE(NUM_OF_ALLIES_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_UNIT_NODE, 3)),
                    14,
                ),
            ),
            // neutralizes unit's penalties,
            NEUTRALIZES_PENALTIES_ON_UNIT_NODE,
            // neutralizes effects that inflict "Special cooldown charge -X" on unit,
            NEUTRALIZES_EFFECTS_THAT_INFLICT_SPECIAL_COOLDOWN_CHARGE_MINUS_X_ON_UNIT,
            new NumThatIsNode(
                new SkillEffectNode(
                    // unit deals +X damage,
                    new UnitDealsDamageExcludingAoeSpecialsNode(READ_NUM_NODE),
                    // and reduces damage from foe's first attack by 50% of X during combat
                    new ReducesDamageFromFoesFirstAttackByNDuringCombatIncludingTwiceNode(
                        MULT_TRUNC_NODE(0.5, READ_NUM_NODE)),
                    // and also,
                    // when foe's attack triggers foe's Special, reduces Special damage by 50% of X (excluding area-of-effect Specials).
                    new ReducesDamageWhenFoesSpecialExcludingAoeSpecialNode(MULT_TRUNC_NODE(0.5, READ_NUM_NODE)),
                ),
                // (X = highest total bonuses among unit and allies within 3 rows or 3 columns centered on unit;
                HIGHEST_TOTAL_BONUSES_AMONG_UNIT_AND_ALLIES_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_UNIT,
                // "first attack" normally means only the first strike; for effects that grant "unit attacks twice," it means the first and second strikes),
            ),
        ),
    ));
}

// 正義の一矢の弓
{
    let skillId = Weapon.JustBow;
    // Accelerates Special trigger (cooldown count-1). Effective against flying foes.

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit initiates combat or if there is an ally within 3 rows or 3 columns centered on unit,
        IF_NODE(OR_NODE(DOES_UNIT_INITIATE_COMBAT_NODE, IS_THERE_ALLY_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_UNIT_NODE),
            // grants bonus to unit's
            // Atk/Spd/Def/Res = 5 + 15% of unit's Spd at start of combat,
            new GrantsAllStatsPlusNToTargetDuringCombatNode(
                ADD_NODE(5, MULT_TRUNC_NODE(0.15, UNITS_SPD_AT_START_OF_COMBAT_NODE)),
            ),
            // unit deals +7 damage (excluding area-of-effect Specials),
            new UnitDealsDamageExcludingAoeSpecialsNode(7),
            // and neutralizes effects that inflict "Special cooldown charge -X" on unit during combat,
            NEUTRALIZES_EFFECTS_THAT_INFLICT_SPECIAL_COOLDOWN_CHARGE_MINUS_X_ON_UNIT,
            // and also,
            // when unit's Special triggers,
            // neutralizes foe's "reduces damage by X%" effects from foe's non-Special skills during combat (excluding area-of-effect Specials).
            WHEN_SPECIAL_TRIGGERS_NEUTRALIZES_FOES_REDUCES_DAMAGE_BY_PERCENTAGE_EFFECTS_FROM_FOES_NON_SPECIAL_EXCLUDING_AOE_SPECIALS_NODE,
        ),
        // If unit initiates combat,
        IF_NODE(DOES_UNIT_INITIATE_COMBAT_NODE,
            // grants Special cooldown count-1 to unit before unit's first attack during combat,
            new GrantsSpecialCooldownCountMinusNToTargetBeforeTargetsFirstAttackDuringCombatNode(1),
            // and also,
            // if foe's attack can trigger foe's Special,
            IF_NODE(CAN_FOES_ATTACK_TRIGGER_FOES_SPECIAL_NODE,
                // inflicts Special cooldown count+1 on foe before foe's first attack during combat (cannot exceed the foe's maximum Special cooldown).
                INFLICTS_SPECIAL_COOLDOWN_COUNT_PLUS_N_ON_TARGETS_FOE_BEFORE_TARGETS_FOES_FIRST_ATTACK_NODE(1),
            ),
        ),
    ));

    FOR_ALLIES_GRANTS_STATS_PLUS_TO_ALLIES_DURING_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // For allies within 3 rows or 3 columns centered on unit,
        IF_NODE(IS_TARGET_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_SKILL_OWNER_NODE,
            // grants Atk/Spd+4 during their combat,
            new GrantsStatsPlusToTargetDuringCombatNode(4, 4, 0, 0),
        ),
    ));

    FOR_ALLIES_GRANTS_EFFECTS_TO_ALLIES_DURING_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // For allies within 3 rows or 3 columns centered on unit,
        IF_NODE(IS_TARGET_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_SKILL_OWNER_NODE,
            // if ally initiates combat and
            IF_NODE(DOES_TARGET_INITIATE_COMBAT_NODE,
                // foe's attack can trigger foe's Special,
                IF_NODE(CAN_FOES_ATTACK_TRIGGER_FOES_SPECIAL_NODE,
                    // inflicts Special cooldown count+ 1 on foe before foe's first attack during their combat (cannot exceed the foe's maximum Special cooldown).
                    INFLICTS_SPECIAL_COOLDOWN_COUNT_PLUS_N_ON_TARGETS_FOE_BEFORE_TARGETS_FOES_FIRST_ATTACK_NODE(1),
                ),
            ),
        ),
    ));
}

/**
 * @param skillId
 * @param {[number, number, number, number]} statsRatios
 */
function setDiscord(skillId, statsRatios) {
    // Spd/Res Discord
    // At start of player phase or enemy phase,
    let nodeFunc = () => new SkillEffectNode(
        new ForEachUnitNode(
            TARGETS_FOES_NODE,
            AND_NODE(
                // on foes with Res ‹ unit's Res and
                LT_NODE(TARGETS_EVAL_RES_ON_MAP, SKILL_OWNERS_EVAL_RES_ON_MAP),
                // that are within 2 spaces of another foe through their next actions.
                IS_TARGET_WITHIN_2_SPACES_OF_TARGETS_ALLY_NODE),

            // inflicts Spd/Res-6 and [Discord]
            new InflictsStatsMinusOnTargetOnMapNode(...statsRatios.map(x => x * 6)),
            new InflictsStatusEffectsOnTargetOnMapNode(StatusEffectType.Discord),
        ),
    );
    AT_START_OF_TURN_HOOKS.addSkill(skillId, nodeFunc);
    AT_START_OF_ENEMY_PHASE_HOOKS.addSkill(skillId, nodeFunc);

    // noinspection JSCheckFunctionSignatures
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        new NumThatIsNode(
            // Inflicts penalty on foe's Spd/Res during combat
            new InflictsStatsMinusOnFoeDuringCombatNode(...statsRatios.map(x => MULT_NODE(x, READ_NUM_NODE))),
            // = number of foes inflicted with (Discord) within 2 spaces of target,
            // including target, x 2, + 4 (max 10) and
            new EnsureMaxNode(
                ADD_NODE(
                    MULT_NODE(
                        // TODO: リファクタリング
                        ADD_NODE(
                            new NumOfFoesAlliesWithinNSpacesNode(2, new HasTargetStatusEffectNode(StatusEffectType.Discord)),
                            COND_OP(new HasFoeStatusEffectNode(StatusEffectType.Discord), 1, 0)),
                        2,
                    ),
                    4,
                ),
                10,
            ),
        ),
        // deals damage = 15% of unit's Res (excluding area-of-effect Specials).
        DEALS_DAMAGE_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS(15, UNITS_RES_DURING_COMBAT_NODE),
    ));
}

// 不和
{
    setDiscord(PassiveB.AtkResDiscord, [1, 0, 0, 1]);
    setDiscord(PassiveB.SpdResDiscord, [0, 1, 0, 1]);
    setDiscord(PassiveB.DefResDiscord, [0, 0, 1, 1]);
}

// 鎮魂の願い
{
    let skillId = Special.RequiemPrayer;
    // 通常攻撃奥義(範囲奥義・疾風迅雷などは除く)
    NORMAL_ATTACK_SPECIAL_SET.add(skillId);

    // 奥義カウント設定(ダメージ計算機で使用。奥義カウント2-4の奥義を設定)
    setSpecialCount(skillId, 2)

    // When Special triggers, boosts damage by 40% of unit's Res and neutralizes "reduces damage by X%" effects from foe's non-Special skills.
    WHEN_APPLIES_SPECIAL_EFFECTS_AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        new BoostsDamageWhenSpecialTriggersNode(
            MULT_TRUNC_NODE(0.4, UNITS_RES_DURING_COMBAT_NODE),
        ),
    ));

    AT_START_OF_ATTACK_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit's Res > foe's Res, reduces damage from attacks during combat and from area-of-effect Specials (excluding
        // Rokkr area-of-effect Specials) by percentage = 4 - current
        // Special cooldown count value, x difference between stats (max difference between stats: 10).
        IF_NODE(UNITS_RES_GT_FOES_RES_DURING_COMBAT_NODE,
            new ReducesDamageFromAoeSpecialsByXPercentNode(
                MULT_TRUNC_NODE(
                    SUB_NODE(4, UNITS_CURRENT_SPECIAL_COOLDOWN_COUNT_DURING_COMBAT),
                    new EnsureMaxNode(DIFFERENCE_BETWEEN_RES_STATS_NODE, 10),
                ),
            ),
        ),

        // Reduces damage from attacks by percentage = 40 - current Special cooldown count value × 10 during combat.
        new ReducesDamageFromAttacksDuringCombatByXPercentAsSpecialSkillEffectPerAttackNode(
            SUB_NODE(40, MULT_NODE(10, UNITS_CURRENT_SPECIAL_COOLDOWN_COUNT_DURING_COMBAT))
        ),
    ));

    BEFORE_AOE_SPECIAL_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit's Res > foe's Res, reduces damage from attacks during combat and from area-of-effect Specials (excluding
        // Rokkr area-of-effect Specials) by percentage = 4 - current
        // Special cooldown count value, x difference between stats (max difference between stats: 10).
        IF_NODE(UNITS_STAT_GT_FOES_STAT_AT_START_OF_COMBAT_NODE(STATUS_INDEX.Res),
            new ReducesDamageFromAoeSpecialsByXPercentNode(
                MULT_TRUNC_NODE(
                    SUB_NODE(4, UNITS_CURRENT_SPECIAL_COOLDOWN_COUNT_DURING_COMBAT),
                    new EnsureMaxNode(DIFFERENCE_BETWEEN_RES_STATS_AT_START_OF_COMBAT_NODE, 10),
                ),
            ),
        ),
    ))

    // If unit triggers Special during the current turn, enables (Canto (2)] .
    CAN_TRIGGER_CANTO_HOOKS.addSkill(skillId, () => new IsTargetsSpecialTriggeredNode());
    CALCULATES_DISTANCE_OF_CANTO_HOOKS.addSkill(skillId, () => new ConstantNumberNode(2));

    // When Canto triggers,
    // enables unit to use (Sing/Dance) (can be triggered by any Canto effect other than the Canto effect from this Special; once per turn; if similar effects are active,
    // this effect does not trigger; this effect is not treated as an Assist skill,
    // nor is it treated as a Sing or Dance skill).
    WHEN_CANTO_TRIGGERS_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        UNLESS_NODE(new IsCantoSingDanceActivatedByTargetNode(),
            new EnablesTargetToUseCantoAssistOnTargetsAllyNode(AssistType.Refresh, CantoSupport.SingDance, 1),
        ),
    ));
}

// 魔器ブルトガング
{
    let skillId = Weapon.ArcaneBlutgang;
    // Arcane Blutgang
    // Mt: 14 Rng:2
    // Accelerates Special trigger (cooldown count-1).
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of combat, if unit's HP ≥ 25%, grants bonus to
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_TURN_NODE(
            // unit's Atk/Spd/Def/Res = 25% of foe's Atk at start of
            // combat - 4 (min 5; max 14),
            new GrantsAllStatsPlusNToTargetDuringCombatNode(
                new EnsureMinMaxNode(
                    SUB_NODE(MULT_TRUNC_NODE(0.25, FOES_ATK_AT_START_OF_COMBAT_NODE), 4),
                    5, 14,
                ),
            ),
            // deals damage = 15% of unit's
            // Atk (including when dealing damage with a Special triggered before combat),
            DEALS_DAMAGE_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS(15, UNITS_ATK_DURING_COMBAT_NODE),
            // reduces damage from foe's first attack by 7 ("first attack" normally means only the first strike; for effects that grant "unit attacks twice," it means the first and second strikes),
            new ReducesDamageFromFoesFirstAttackByNDuringCombatIncludingTwiceNode(7),
            // neutralizes effects that inflict "Special cooldown charge -X" on unit,
            NEUTRALIZES_EFFECTS_THAT_INFLICT_SPECIAL_COOLDOWN_CHARGE_MINUS_X_ON_UNIT,
            // and grants Special cooldown count-1 to unit before unit's first attack during combat.
            new GrantsSpecialCooldownCountMinusNToTargetBeforeTargetsFirstAttackDuringCombatNode(1),
        )
    ));

    BEFORE_AOE_SPECIAL_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // deals damage = 15% of unit's
        // Atk (including when dealing damage with a Special triggered before combat),
        new UnitDealsDamageBeforeCombatNode(MULT_TRUNC_NODE(15, UNITS_ATK_AT_START_OF_COMBAT_NODE)),
    ));
}

// ストーン
{
    let skillId = getSpecialRefinementSkillId(Weapon.Petrify);
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of combat,
        // if unit's HP ≥ 25%,
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE(
            // grants Atk/Spd/Def/Res+5 to unit,
            GRANTS_ALL_STATS_PLUS_5_TO_UNIT_DURING_COMBAT_NODE,
            // neutralizes foe's bonuses to Atk/Res,
            new NeutralizesFoesBonusesToStatsDuringCombatNode(true, false, false, true),
            // unit deals +X damage (excluding area-of-effect Specials;
            new UnitDealsDamageExcludingAoeSpecialsNode(
                // X = highest total penalties among target and foes within 2 spaces of target),
                HIGHEST_TOTAL_PENALTIES_AMONG_TARGET_AND_FOES_WITHIN_N_SPACES_OF_TARGET_NODE(2),
            ),
            // and reduces damage from foe's attacks by 30% during combat (excluding area-of-effect Specials).
            new ReducesDamageFromTargetsFoesAttacksByXPercentDuringCombatNode(30),
        )
    ));
}

{
    let skillId = getRefinementSkillId(Weapon.Petrify);
    // Grants Res+3.
    let getNode = (turn, index) =>
        IF_NODE(EQ_NODE(CURRENT_TURN_NODE, turn),
            // At start of turns 1 through 5,
            // inflicts【Gravity】on foe on the enemy team with the lowest specified stat (see below), and also,
            FOR_EACH_UNIT_NODE(new TargetsFoesOnTheEnemyTeamWithLowestStatNode(index),
                new InflictsStatusEffectsAtStartOfTurnNode(StatusEffectType.Gravity),
            ),
            // inflicts Atk/Spd-7 and【Sabotage】 on that foe and foes within 2 spaces of that foe through their next actions.
            // (Specified stats: Turn 1 = HP, Turn 2 = Atk, Turn 3 = Spd, Turn 4 = Def, Turn 5 = Res.)
            FOR_EACH_UNIT_NODE(
                new UniteUnitsNode(
                    new TargetsAndThoseAlliesWithinNSpacesNode(2,
                        new TargetsFoesOnTheEnemyTeamWithLowestStatNode(index),
                    ),
                ),
                new InflictsStatsMinusAtStartOfTurnNode(7, 7, 0, 0),
                new InflictsStatusEffectsAtStartOfTurnNode(StatusEffectType.Sabotage),
            ),
        );
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        getNode(1, StatusType.Hp),
        getNode(2, StatusType.Atk),
        getNode(3, StatusType.Spd),
        getNode(4, StatusType.Def),
        getNode(5, StatusType.Res),
    ));

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit initiates combat or the number of allies adjacent to unit ≤ 1,
        IF_NODE(OR_NODE(DOES_UNIT_INITIATE_COMBAT_NODE, LTE_NODE(NUM_OF_TARGET_ALLIES_ADJACENT_TO_TARGET(), 1)),
            // grants Atk/Spd/Def/Res+5 to unit and
            GRANTS_ALL_STATS_PLUS_5_TO_UNIT_DURING_COMBAT_NODE,
            // unit makes a guaranteed follow-up attack during combat.
            UNIT_MAKES_GUARANTEED_FOLLOW_UP_ATTACK_NODE,
        ),
    ));
}
{
    let skillId = getNormalSkillId(Weapon.Petrify);
    let getNode = (turn, index) =>
        IF_NODE(EQ_NODE(CURRENT_TURN_NODE, turn),
            // At start of turns 1 through 5, inflicts Atk/Spd-7 and【Gravity】on foe on the enemy team with the lowest specified stat (see below).
            // (Specified stats: Turn 1 = HP, Turn 2 = Atk, Turn 3 = Spd, Turn 4 = Def, Turn 5 = Res.)
            FOR_EACH_UNIT_NODE(new TargetsFoesOnTheEnemyTeamWithLowestStatNode(index),
                new InflictsStatsMinusAtStartOfTurnNode(7, 7, 0, 0),
                new InflictsStatusEffectsAtStartOfTurnNode(StatusEffectType.Gravity),
            ),
        );
    // Grants Res+3.
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        getNode(1, StatusType.Hp),
        getNode(2, StatusType.Atk),
        getNode(3, StatusType.Spd),
        getNode(4, StatusType.Def),
        getNode(5, StatusType.Res),
    ));
}

// カドゥケウスの杖
{
    let skillId = getSpecialRefinementSkillId(Weapon.CaduceusStaff);
    // Allies within 2 spaces of unit can move to any space within 2 spaces of unit.
    setSkillThatAlliesWithinNSpacesOfUnitCanMoveToAnySpaceWithinMSpacesOfUnit(skillId, 2, 2);

    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of turn,
        // if unit is within 2 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_2_SPACES_OF_SKILL_OWNER_NODE,
            // grants Atk/Res+6 and "Special cooldown charge +1 per attack during combat (only highest value applied; does not stack)"
            // to unit and allies within 2 spaces of unit for 1 turn.
            new ForEachTargetAndTargetsAllyWithin2SpacesOfTargetNode(TRUE_NODE,
                new GrantsStatsPlusAtStartOfTurnNode(6, 0, 0, 6),
                new GrantsStatusEffectsAtStartOfTurnNode(StatusEffectType.SpecialCooldownChargePlusOnePerAttack),
            ),
        ),
    ));

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit initiates combat or is within 2 spaces of an ally,
        IF_UNIT_INITIATES_COMBAT_OR_IS_WITHIN_2_SPACES_OF_AN_ALLY(
            // grants Atk/Spd/Def/Res+5 to unit and
            GRANTS_ALL_STATS_PLUS_5_TO_UNIT_DURING_COMBAT_NODE,
            // unit makes a guaranteed follow-up attack during combat.
            UNIT_MAKES_GUARANTEED_FOLLOW_UP_ATTACK_NODE,
        ),
    ));
}
{
    let skillId = getRefinementSkillId(Weapon.CaduceusStaff);
    // Calculates damage from staff like other weapons.

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit is within 3 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_TARGETS_ALLY_NODE,
            // grants Atk/Spd/Def/Res+5 to unit,
            GRANTS_ALL_STATS_PLUS_5_TO_UNIT_DURING_COMBAT_NODE,
            // reduces damage from foe's attacks by 30% (excluding area-of-effect Specials),
            new ReducesDamageFromTargetsFoesAttacksByXPercentDuringCombatNode(30),
            // and inflicts Special cooldown charge -1 on foe per attack during combat (only highest value applied; does not stack).
            INFLICTS_SPECIAL_COOLDOWN_CHARGE_MINUS_1_ON_FOE_NODE,
        ),
    ));

    // For allies within 2 spaces of unit,
    FOR_ALLIES_GRANTS_EFFECTS_TO_ALLIES_DURING_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        IF_NODE(IS_TARGET_WITHIN_2_SPACES_OF_SKILL_OWNER_NODE,
            // grants Atk/Res+4,
            new GrantsStatsPlusToTargetDuringCombatNode(4, 0, 0, 4),
        ),
    ));

    FOR_ALLIES_GRANTS_EFFECTS_TO_ALLIES_DURING_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        IF_NODE(IS_TARGET_WITHIN_2_SPACES_OF_SKILL_OWNER_NODE,
            // reduces damage from foe's attacks by 30% (excluding area-of-effect Specials),
            new ReducesDamageFromTargetsFoesAttacksByXPercentDuringCombatNode(30),
            // and inflicts Special cooldown charge -1 on foe per attack during combat (only highest value applied; does not stack).
            INFLICTS_SPECIAL_COOLDOWN_CHARGE_MINUS_1_ON_FOE_NODE,
        ),
    ));
}
{
    let skillId = getNormalSkillId(Weapon.CaduceusStaff);
    // Calculates damage from staff like other weapons.
    FOR_ALLIES_GRANTS_EFFECTS_TO_ALLIES_DURING_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // Reduces damage from foes' attacks during combat to allies within 2 spaces by 30%.
        IF_NODE(IS_TARGET_WITHIN_2_SPACES_OF_SKILL_OWNER_NODE,
            new ReducesDamageFromTargetsFoesAttacksByXPercentDuringCombatNode(30),
        ),
    ));
}

// 波閉ざす錨の斧
{
    let skillId = getSpecialRefinementSkillId(Weapon.GateAnchorAxe);
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of turn,
        // if unit's HP ≥ 25%,
        IF_NODE(IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_TURN_NODE,
            // inflicts Atk/Def-7 and【Feud】on closest foes and foes within 2 spaces of those foes through their next actions.
            FOR_EACH_TARGETS_CLOSEST_FOE_AND_ANY_FOE_WITHIN_2_SPACES_OF_THOSE_FOES_NODE(
                new InflictsStatsMinusAtStartOfTurnNode(7, 0, 7, 0),
                new InflictsStatusEffectsAtStartOfTurnNode(StatusEffectType.Feud),
            ),
        )
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of combat,
        // if unit's HP ≥ 25%,
        IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE(
            // grants Def/Res+5 to unit,
            new GrantsStatsPlusToTargetDuringCombatNode(0, 0, 5, 5),
            // inflicts Def/Res-5 on foe,
            new InflictsStatsMinusOnFoeDuringCombatNode(0, 0, 5, 5),
            // and deals damage = 20% of unit's Def during combat (excluding area-of-effect Specials),
            DEALS_DAMAGE_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS(20, UNITS_DEF_DURING_COMBAT_NODE),
            // and also,
            // when unit's Special triggers,
            // neutralizes foe's "reduces damage by X%" effects from foe's non-Special skills (excluding area-of-effect Specials).
            WHEN_SPECIAL_TRIGGERS_NEUTRALIZES_FOES_REDUCES_DAMAGE_BY_PERCENTAGE_EFFECTS_FROM_FOES_NON_SPECIAL_EXCLUDING_AOE_SPECIALS_NODE,
        ),
    ));
}

{
    let skillId = getRefinementSkillId(Weapon.GateAnchorAxe);
    // Enables【Canto (Dist. +1; Max ４)】.
    enablesCantoDist(skillId, 1, 4);
    // Accelerates Special trigger (cooldown count-1).

    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode());
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit initiates combat or if the number of allies adjacent to unit ≤ 1,
        IF_NODE(OR_NODE(DOES_UNIT_INITIATE_COMBAT_NODE, LTE_NODE(NUM_OF_TARGET_ALLIES_ADJACENT_TO_TARGET(), 1)),
            // grants Def/Res+5 to unit,
            new GrantsStatsPlusToTargetDuringCombatNode(0, 0, 5, 5),
            // inflicts Def/Res-5 on foe,
            new InflictsStatsMinusOnFoeDuringCombatNode(0, 0, 5, 5),
            // unit makes a guaranteed follow-up attack,
            UNIT_MAKES_GUARANTEED_FOLLOW_UP_ATTACK_NODE,
            // and grants Special cooldown count-X to unit before unit's first attack during combat
            new GrantsSpecialCooldownCountMinusNToTargetBeforeTargetsFirstAttackDuringCombatNode(
                // (X = number of spaces from start position to end position of whoever initiated combat; max 3).
                new EnsureMaxNode(NUMBER_OF_SPACES_FROM_START_POSITION_TO_END_POSITION_OF_WHOEVER_INITIATED_COMBAT, 3),
            ),
        ),
    ));
}

{
    let skillId = getNormalSkillId(Weapon.GateAnchorAxe);
    // Accelerates Special trigger (cooldown count-1).
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit is not adjacent to an ally,
        IF_NODE(IS_NOT_TARGET_ADJACENT_TO_AN_ALLY,
            // grants Def/Res+5 to unit and inflicts Def/Res-5 on foe during combat and unit makes a guaranteed follow-up attack.
            new GrantsStatsPlusToTargetDuringCombatNode(0, 0, 5, 5),
            new InflictsStatsMinusOnFoeDuringCombatNode(0, 0, 5, 5),
            UNIT_MAKES_GUARANTEED_FOLLOW_UP_ATTACK_NODE,
        )
    ));
}

// 豊穣の子兎の爪牙
{
    let skillId = Weapon.FullRabbitFang;
    // Enables【Canto (Rem. +1)】.
    enablesCantoRemPlus(skillId, 1);
    // Effective against cavalry foes. Grants Spd+3.

    // At start of turn,
    // if unit is adjacent to only beast or dragon allies or is not adjacent to any ally,
    // unit transforms (otherwise,
    // unit reverts). If unit transforms,
    // grants Atk+2 to unit,
    // inflicts Atk/Def-X on foe during combat (X = number of spaces from start position to end position of whoever initiated combat,
    // + 3; max 6),
    // and also,
    // if X ≥ 5,
    // reduces damage from foe's first attack by 30% during combat.
    setBeastSkill(skillId, BeastCommonSkillType.Cavalry2);

    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of turn,
        // if number of adjacent allies other than beast or dragon allies ≤ 1,
        // or if unit's conditions for transforming are met,
        IF_NODE(OR_NODE(
                // TODO: 化身が予約になっていないので化身条件を満たすかではなく化身したかによっての判定になっているので化身修正時に同時に修正する
                LTE_NODE(new NumOfTargetsAlliesWithinNSpacesNode(1, new IsTargetBeastOrDragonTypeNode()), 1),
                new IsTargetTransformedNode()),
            // grants Special cooldown count-1 to unit.
            new GrantsSpecialCooldownCountMinusOnTargetAtStartOfTurnNode(1),
        ),
    ));

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If number of adjacent allies other than beast or dragon allies ≤ 1,
        // or if unit is transformed,
        IF_NODE(OR_NODE(
                // TODO: 化身が予約になっていないので化身条件を満たすかではなく化身したかによっての判定になっているので化身修正時に同時に修正する
                LTE_NODE(new NumOfTargetsAlliesWithinNSpacesNode(1, new IsTargetBeastOrDragonTypeNode()), 1),
                new IsTargetTransformedNode()),
            // grants bonus to unit's Atk/Spd/Def/Res = 5 + number of foes within 3 rows or 3 columns centered on unit × 3 (max 14),
            new GrantsAllStatsPlusNToTargetDuringCombatNode(
                new EnsureMaxNode(
                    ADD_NODE(5, MULT_NODE(NUM_OF_FOES_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_UNIT_NODE, 3)),
                    14,
                ),
            ),
            // deals damage = 20% of unit's Spd (excluding area-of-effect Specials),
            DEALS_DAMAGE_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS(20, UNITS_SPD_DURING_COMBAT_NODE),
            // and neutralizes effects that guarantee foe's follow-up attacks and effects that prevent unit's follow-up attacks during combat,
            NULL_UNIT_FOLLOW_UP_NODE,
        ),
    ));

    AFTER_COMBAT_AFTER_HEAL_OR_DAMAGE_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // and after combat,
        // if unit's HP ≤ 90%,
        IF_NODE(new IsTargetsHpLteXPercentOnMapNode(90),
            // grants Special cooldown count-2 to unit.
            new GrantsSpecialCooldownCountMinusOnTargetOnMapNode(2),
        ),
    ));
}

// 双界ナギの比翼効果
{
    WHEN_TRIGGERS_DUO_OR_HARMONIZED_EFFECT_HOOKS_MAP.addValue(Hero.HarmonizedNagi,
        new SkillEffectNode(
            // For unit and allies from the same titles as unit,
            new ForEachUnitFromSameTitlesNode(
                // grants Atk/Res+6,
                new GrantsStatsNode(6, 0, 0, 6),
                // 【Resonance: Shields】,
                // "neutralizes 'effective against dragons' bonuses," and
                // 【Warp Bubble】for 1 turn,
                new GrantsStatusEffectsNode(
                    StatusEffectType.ResonantShield,
                    StatusEffectType.ShieldDragon,
                    StatusEffectType.WarpBubble,
                ),
                // neutralizes any【Penalty】,
                NEUTRALIZES_ANY_PENALTY_ON_TARGET_NODE,
                // and restores 30 HP.
                new RestoreTargetHpNode(30),
            ),
        )
    )
}

// 神魔の双竜の竜石
{
    let skillId = Weapon.OpposingStones;
    // Accelerates Special trigger (cooldown count-1).
    // Effective against dragon foes. Neutralizes "effective against armored" bonuses.
    // If foe's Range = 2,
    // calculates damage using the lower of foe's Def or Res.
    // Unit can counterattack regardless of foe's range.

    BEFORE_AOE_SPECIAL_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // Reduces damage from area-of-effect Specials (excluding Røkkr area-of-effect Specials) by 80%.
        new ReducesDamageFromAoeSpecialsByXPercentNode(80),
    ));

    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of turn,
        // if unit's Special cooldown count is at its maximum value,
        // grants Special cooldown count-1 to unit.
        IF_TARGETS_SPECIAL_COOLDOWN_COUNT_IS_AT_ITS_MAXIMUM_VALUE_GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_X_NODE(1),
    ));

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // Grants weapon-triangle advantage against colorless foes and inflicts weapon-triangle disadvantage on colorless foes during combat.
        GRANTS_TRIANGLE_ADVANTAGE_AGAINST_COLORLESS_TARGETS_FOES_AND_INFLICTS_TRIANGLE_DISADVANTAGE_ON_COLORLESS_TARGETS_FOES_DURING_COMBAT_NODE,
        // If foe initiates combat or if foe's HP ≥ 75% at start of combat,
        IF_FOE_INITIATES_COMBAT_OR_IF_FOES_HP_GTE_75_PERCENT_AT_START_OF_COMBAT(
            new NumThatIsNode(
                // inflicts penalty on foe's Atk/Def/Res = 5 + number of allies within 3 spaces of unit × 3 (max 14; if unit triggers Savior,
                // value is treated as 14),
                new InflictsStatsMinusOnFoeDuringCombatNode(READ_NUM_NODE, 0, READ_NUM_NODE, READ_NUM_NODE),
                COND_OP(new DoesTargetTriggerSaviorNode(),
                    14,
                    new EnsureMaxNode(
                        ADD_NODE(5, MULT_NODE(NUM_OF_ALLIES_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_UNIT_NODE, 3)),
                        14,
                    ),
                )
            ),
            new AppliesSkillEffectsAfterStatusFixedNode(
                // and reduces damage from foe's attacks by 20% of unit's Res during combat (excluding area-of-effect Specials),
                new ReducesDamageExcludingAoeSpecialsNode(MULT_TRUNC_NODE(0.2, UNITS_RES_DURING_COMBAT_NODE)),
            ),
            // and after combat,
            // restores 7 HP to unit,
            RESTORES_7_HP_TO_UNIT_AFTER_COMBAT_NODE,
        ),
    ));

    AFTER_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        IF_FOE_INITIATES_COMBAT_OR_IF_FOES_HP_GTE_75_PERCENT_AT_START_OF_COMBAT(
            // and also,
            // if unit's Special cooldown count is at its maximum value,
            // grants Special cooldown count-1 to unit.
            IF_TARGETS_SPECIAL_COOLDOWN_COUNT_IS_AT_ITS_MAXIMUM_VALUE_GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_X_NODE(1),
        ),
    ))

    FOR_ALLIES_GRANTS_STATS_PLUS_TO_ALLIES_DURING_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_SKILL_OWNER_NODE,
            // Grants Atk/Def/Res+4 to allies within 3 spaces during combat and restores 7 HP to those allies after their combat.
            new GrantsStatsPlusToTargetDuringCombatNode(4, 0, 4, 4),
        )
    ));

    FOR_ALLIES_GRANTS_EFFECTS_TO_ALLIES_AFTER_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_SKILL_OWNER_NODE,
            // Grants Atk/Def/Res+4 to allies within 3 spaces during combat and restores 7 HP to those allies after their combat.
            RESTORES_7_HP_TO_UNIT_AFTER_COMBAT_NODE,
        )
    ));
}

// 護り手・近・双
{
    // 鎧の護り手・近・双
    setTwinSave(PassiveC.ADTwinNSave, true, new GrantsStatsPlusToTargetDuringCombatNode(4, 0, 4, 0));
    // 兜の護り手・近・双
    setTwinSave(PassiveC.ARTwinNSave, true, new GrantsStatsPlusToTargetDuringCombatNode(4, 0, 0, 4));
    // 盾の護り手・近・双
    setTwinSave(PassiveC.DRTwinNSave, true, new GrantsStatsPlusToTargetDuringCombatNode(0, 0, 4, 4));
}

// 護り手・遠・双
{
    setTwinSave(PassiveC.ARTwinFSave, false, new GrantsStatsPlusToTargetDuringCombatNode(4, 0, 0, 4));
    setTwinSave(PassiveC.ADTwinFSave, false, new GrantsStatsPlusToTargetDuringCombatNode(4, 0, 4, 0));
}

// 護り手・X・茨
{
    setBriarSave(PassiveC.ARBriarNSave, true, new GrantsStatsPlusToTargetDuringCombatNode(4, 0, 0, 4));
    setBriarSave(PassiveC.ADBriarNSave, true, new GrantsStatsPlusToTargetDuringCombatNode(4, 0, 4, 0));
    setBriarSave(PassiveC.ADBriarFSave, false, new GrantsStatsPlusToTargetDuringCombatNode(4, 0, 4, 0));
}

// 竜の堅鱗
{
    let skillId = PassiveB.DragonsScales;
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode());
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If foe initiates combat or if unit's HP ≥ 25% at start of combat,
        IF_NODE(OR_NODE(DOES_FOE_INITIATE_COMBAT_NODE, IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_TURN_NODE),
            new GrantsOrInflictsStatsAfterStatusFixedNode(
                new NumThatIsNode(
                    // inflicts Atk/Def/Res-X on foe
                    new InflictsStatsMinusOnFoeDuringCombatNode(READ_NUM_NODE, 0, READ_NUM_NODE, READ_NUM_NODE),
                    // (X = 4 + the greater of the difference between Def stats or difference between Res stats (unit's Def/Res minus foe's Def/Res); max 11; if either of unit's stats < foe's stat,
                    // difference is treated as 0),
                    new EnsureMaxNode(
                        ADD_NODE(4, MAX_NODE(DEF_DIFF_DURING_COMBAT_NODE, RES_DIFF_DURING_COMBAT_NODE, 0)),
                        11,
                    ),
                ),
            ),
            // unit makes a guaranteed follow-up attack,
            UNIT_MAKES_GUARANTEED_FOLLOW_UP_ATTACK_NODE,
            // grants Special cooldown count-1 to unit before foe's first attack,
            new GrantsSpecialCooldownCountMinusNToUnitBeforeFoesFirstAttackDuringCombatNode(1),
            // and reduces the percentage of foe's non-Special "reduce damage by X%" skills by 50% during combat (excluding area-of-effect Specials).
            REDUCES_PERCENTAGE_OF_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE,
        ),
    ));
}

// 収穫の喜びの竜石
{
    let skillId = Weapon.StoneOfDelights;
    // Accelerates Special trigger (cooldown count-1).
    // If foe's Range = 2,
    // calculates damage using the lower of foe's Def or Res.

    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of turn,
        // grants Special cooldown count-1 to unit and to any ally with max HP < unit's max HP.
        new ForTargetsAlliesOnMapNode(LT_NODE(new TargetsHpAtStartOfTurnNode(), new SkillOwnerMaxHpNode()), true,
            new GrantsSpecialCooldownCountMinusOnTargetAtStartOfTurnNode(1),
        ),
    ));

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit is within 3 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_TARGETS_ALLY_NODE,
            new NumThatIsNode(
                // inflicts penalty on foe's Atk/Def/Res = 5 + number of allies within 3 spaces of unit × 3 (max 14; if unit triggers Savior,
                // value is treated as 14),
                new InflictsStatsMinusOnFoeDuringCombatNode(READ_NUM_NODE, 0, READ_NUM_NODE, READ_NUM_NODE),
                COND_OP(new DoesTargetTriggerSaviorNode(),
                    14,
                    new EnsureMaxNode(
                        ADD_NODE(5, MULT_NODE(NUM_OF_ALLIES_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_UNIT_NODE, 3)),
                        14,
                    ),
                )
            ),
            new NumThatIsNode(
                new SkillEffectNode(
                    // unit deals +X damage,
                    new UnitDealsDamageExcludingAoeSpecialsNode(READ_NUM_NODE),
                    // and reduces damage from foe's attacks by X during combat
                    new ReducesDamageExcludingAoeSpecialsNode(READ_NUM_NODE),
                ),
                new EnsureMinMaxNode(SUB_NODE(new TargetsMaxHpNode(), new FoesHpAtStartOfCombatNode()), 8, 16),
                // (X = unit's max HP - foe's HP at start of combat; max 16; min 8; including when dealing damage with a Special triggered before combat,
                // in which case X is calculated using HP before Special triggers),
            ),
            // and also,
            new AppliesSkillEffectsAfterStatusFixedNode(
                // if foe's attack can trigger foe's Special and unit's Res ≥ foe's Res+5 during combat,
                IF_NODE(AND_NODE(
                        CAN_FOES_ATTACK_TRIGGER_FOES_SPECIAL_NODE,
                        GTE_NODE(UNITS_EVAL_RES_DURING_COMBAT_NODE, ADD_NODE(FOES_EVAL_RES_DURING_COMBAT_NODE, 5))),
                    // inflicts Special cooldown count+1 on foe before foe's first attack (cannot exceed the foe's maximum Special cooldown).
                    INFLICTS_SPECIAL_COOLDOWN_COUNT_PLUS_N_ON_TARGETS_FOE_BEFORE_TARGETS_FOES_FIRST_ATTACK_NODE(1),
                ),
            ),
        ),
    ));

    AFTER_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit is within 3 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_TARGETS_ALLY_NODE,
            // and unit's Special cooldown count is at its maximum value after combat,
            // grants Special cooldown count-1 to unit after combat.
            IF_TARGETS_SPECIAL_COOLDOWN_COUNT_IS_AT_ITS_MAXIMUM_VALUE_GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_X_NODE(1),
        ),
    ));

    BEFORE_AOE_SPECIAL_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        new NumThatIsNode(
            new SkillEffectNode(
                // unit deals +X damage,
                new UnitDealsDamageBeforeCombatNode(READ_NUM_NODE),
                // and reduces damage from foe's attacks by X during combat
                new ReducesDamageBeforeCombatNode(READ_NUM_NODE),
            ),
            new EnsureMinMaxNode(SUB_NODE(new TargetsMaxHpNode(), new FoesHpAtStartOfCombatNode()), 8, 16),
            // (X = unit's max HP - foe's HP at start of combat; max 16; min 8; including when dealing damage with a Special triggered before combat,
            // in which case X is calculated using HP before Special triggers),
        ),
    ));
}

// 感謝の戦猫の爪牙
{
    let skillId = Weapon.HungryCatFang;
    // Accelerates Special trigger (cooldown count-1).

    // At start of turn,
    // if unit is adjacent to only beast or dragon allies or is not adjacent to any ally,
    // unit transforms (otherwise,
    // unit reverts). If unit transforms,
    // grants Atk+2 to unit,
    // inflicts Atk/Def-X on foe during combat (X = number of spaces from start position to end position of whoever initiated combat,
    // + 3; max 6),
    // and also,
    // if X ≥ 5,
    // reduces damage from foe's first attack by 30% during combat.
    setBeastSkill(skillId, BeastCommonSkillType.Cavalry2);

    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of turn,
        // if unit's Special cooldown count is at its maximum value,
        // grants Special cooldown count-1 to unit.
        IF_TARGETS_SPECIAL_COOLDOWN_COUNT_IS_AT_ITS_MAXIMUM_VALUE_GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_X_NODE(1),
    ));

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of combat,
        // if unit's HP ≥ 25%,
        IF_NODE(IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE,
            // grants bonus to unit's Atk/Spd/Def/Res = 5 + number of foes within 3 rows or 3 columns centered on unit × 3 (max 14),
            new GrantsAllStatsPlusNToTargetDuringCombatNode(
                new EnsureMaxNode(
                    ADD_NODE(5, MULT_NODE(NUM_OF_FOES_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_UNIT_NODE, 3)),
                    14,
                ),
            ),
            // neutralizes effects that guarantee foe's follow-up attacks and effects that prevent unit's follow-up attacks,
            NULL_UNIT_FOLLOW_UP_NODE,
            // and neutralizes effects that inflict "Special cooldown charge -X" on unit during combat,
            NEUTRALIZES_EFFECTS_THAT_INFLICT_SPECIAL_COOLDOWN_CHARGE_MINUS_X_ON_UNIT,
            // and also,
            // when unit's Special triggers,
            // neutralizes foe's "reduces damage by X%" effects from foe's non-Special skills (excluding area-of-effect Specials) during combat.
            WHEN_SPECIAL_TRIGGERS_NEUTRALIZES_FOES_REDUCES_DAMAGE_BY_PERCENTAGE_EFFECTS_FROM_FOES_NON_SPECIAL_EXCLUDING_AOE_SPECIALS_NODE,
        ),
    ));

    AFTER_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit's HP ≥ 25% at start of combat and
        IF_NODE(IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE,
            // unit's Special cooldown count is at its maximum value after combat,
            // grants Special cooldown count-1 to unit after combat.
            IF_TARGETS_SPECIAL_COOLDOWN_COUNT_IS_AT_ITS_MAXIMUM_VALUE_GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_X_NODE(1),
        ),
    ));
}

// 人と神が繋がる世界
{
    let skillId = PassiveC.ConnectedWorld;
    // If unit can transform,
    // transformation effects gain "if unit is within 2 spaces of any allies from a different title than unit" as a trigger condition (in addition to existing conditions).
    CAN_TRANSFORM_AT_START_OF_TURN_HOOKS.addSkill(skillId, () =>
        new IsTargetWithinNSpacesOfTargetsAllyNode(2, new IsDifferentOriginNode()),
    );

    // If defending in Aether Raids,
    // at the start of enemy turn 1,
    // if conditions for transforming are met,
    // unit transforms.
    CAN_TRANSFORM_AT_START_OF_ENEMY_TURN_HOOKS.addSkill(skillId, () => EQ_NODE(CURRENT_TURN_NODE, 1));

    let skillEffectNode = new SkillEffectNode(
        // if unit is within 3 spaces of any allies from a different title than unit,
        IF_NODE(new IsTargetWithinNSpacesOfTargetsAllyNode(3, new IsDifferentOriginNode()),
            // to unit and allies within 3 spaces of unit for 1 turn,
            new ForEachTargetAndTargetsAllyWithinNSpacesOfTargetNode(3, TRUE_NODE,
                // grants Atk/Def+6,
                new GrantsStatsPlusAtStartOfTurnNode(6, 0, 6, 0),
                // 【Resonance: Blades】,
                // 【Resonance: Shields】,
                // and "reduces the percentage of foe's non-Special 'reduce damage by X%' skills by 50% during combat (excluding area-of-effect Specials)"
                new GrantsStatusEffectsAtStartOfTurnNode(
                    StatusEffectType.ResonantBlades,
                    StatusEffectType.ResonantShield,
                    StatusEffectType.ReducesPercentageOfFoesNonSpecialReduceDamageSkillsBy50Percent),
                // and also,
                // for unit and allies within 3 spaces of unit,
                // if Special cooldown count is at its maximum value,
                IF_NODE(IS_TARGETS_SPECIAL_COOLDOWN_COUNT_AT_ITS_MAX_AT_START_OF_TURN_NODE,
                    // grants Special cooldown count-1.
                    new GrantsSpecialCooldownCountMinusOnTargetAtStartOfTurnNode(1),
                )
            ),
        )
    );

    // At start of turn,
    // and at start of enemy phase (except for in Summoner Duels),
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => skillEffectNode);
    AT_START_OF_ENEMY_PHASE_HOOKS.addSkill(skillId, () =>
        IF_NODE(IS_NOT_SUMMONER_DUELS_MODE_NODE, skillEffectNode),
    );

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit is within 3 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_TARGETS_ALLY_NODE,
            // grants Atk/Def/Res+5 to unit and
            new GrantsStatsPlusToTargetDuringCombatNode(5, 0, 5, 5),
            // reduces damage from foe's attacks by 40% during combat (excluding area-of-effect Specials),
            new ReducesDamageFromTargetsFoesAttacksByXPercentDuringCombatNode(40),
        ),
    ));

    AFTER_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_TARGETS_ALLY_NODE,
            // and also,
            // if unit's Special cooldown count is at its maximum value after combat,
            // grants Special cooldown count-1 to unit after combat.
            new ForEachTargetAndTargetsAllyWithinNSpacesOfTargetNode(3, TRUE_NODE,
                IF_TARGETS_SPECIAL_COOLDOWN_COUNT_IS_AT_ITS_MAXIMUM_VALUE_GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_X_NODE(1),
            ),
        ),
    ))
}

// 堅固なる獣
{
    let skillId = Special.SturdyBeast;
    // 通常攻撃奥義(範囲奥義・疾風迅雷などは除く)
    NORMAL_ATTACK_SPECIAL_SET.add(skillId);

    // 奥義カウント設定(ダメージ計算機で使用。奥義カウント2-4の奥義を設定)
    COUNT3_SPECIALS.push(skillId);
    INHERITABLE_COUNT3_SPECIALS.push(skillId);

    // Boosts damage by X% of unit's Def when Special triggers (if transformed, X = 50; otherwise, X = 40).
    WHEN_APPLIES_SPECIAL_EFFECTS_AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        new BoostsDamageWhenSpecialTriggersNode(
            MULT_TRUNC_NODE(
                COND_OP(new IsTargetTransformedNode(), 0.5, 0.4),
                UNITS_DEF_DURING_COMBAT_NODE),
        ),
    ));

    AT_APPLYING_ONCE_PER_COMBAT_DAMAGE_REDUCTION_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If both of the following conditions are met, reduces damage from foe's next attack by 40% during combat:
        IF_NODE(
            AND_NODE(
                //   - Unit's or foe's Special is ready, or unit's
                //     or foe's Special triggered before or during
                //     this combat.
                IS_THE_UNITS_OR_FOES_SPECIAL_READY_OR_WAS_THE_UNITS_OR_FOES_SPECIAL_TRIGGERED_BEFORE_OR_DURING_THIS_COMBAT,
                //   - Unit is transformed or unit's Def ≥ foe's
                //     Def-4.
                // (Once per combat; excluding area-of-effect Specials).
                OR_NODE(
                    new IsTargetTransformedNode(),
                    GTE_NODE(UNITS_EVAL_DEF_DURING_COMBAT_NODE, SUB_NODE(FOES_EVAL_DEF_DURING_COMBAT_NODE, 4)),
                ),
            ),
            new ReducesDamageFromTargetsFoesNextAttackByNPercentOncePerCombatNode(40),
        ),
    ));
}

// 開かれし祭の角
{
    let skillId = Weapon.HornOfHarvest;
    // Accelerates Special trigger (cooldown count-1).
    // Foes with Range = 1 cannot move through spaces adjacent to unit (does not affect foes with Pass skills). Foes with Range = 2 cannot move through spaces within 2 spaces of unit (does not affect foes with Pass skills).
    CANNOT_FOE_MOVE_THROUGH_SPACES_ADJACENT_TO_UNIT_HOOKS.addSkill(skillId, () =>
        TRUE_NODE,
    )
    CANNOT_FOE_MOVE_THROUGH_SPACES_WITHIN_2_SPACES_OF_UNIT_HOOKS.addSkill(skillId, () =>
        EQ_NODE(new TargetsRangeNode(), 2),
    )

    FOR_ALLIES_AFTER_EFFECTS_THAT_DEAL_DAMAGE_AS_COMBAT_BEGINS_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // For allies within 2 spaces of unit,
        IF_NODE(IS_TARGET_WITHIN_2_SPACES_OF_SKILL_OWNER_NODE,
            // restores X HP to those allies as their combat begins (triggers after effects that deal damage as combat begins),
            RESTORE_X_HP_LIKE_BREATH_OF_LIFE_4_NODE(),
            // (If target's Def > foe's Def,
            // X = 20% of target's max HP + difference between stats × 4; otherwise,
            // X = 20% of target's max HP; max 40% of target's max HP + damage dealt to unit as combat begins; only highest value applied; does not stack.)
        ),
    ));

    FOR_ALLIES_GRANTS_EFFECTS_TO_ALLIES_DURING_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        IF_NODE(IS_TARGET_WITHIN_2_SPACES_OF_SKILL_OWNER_NODE,
            // and reduces the effect of【Deep Wounds】by 50% during combat.
            new ReducesEffectOfDeepWoundsOnTargetByXPercentDuringCombatNode(50),
        ),
    ));

    AFTER_EFFECTS_THAT_DEAL_DAMAGE_AS_COMBAT_BEGINS_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        IF_FOE_INITIATES_COMBAT_OR_IF_FOES_HP_GTE_75_PERCENT_AT_START_OF_COMBAT(
            // and restores X HP to unit as unit's combat begins (triggers after effects that deal damage as combat begins).
            RESTORE_X_HP_LIKE_BREATH_OF_LIFE_4_NODE(),
        ),
    ));

    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
    ));

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If foe initiates combat or if foe's HP ≥ 75% at start of combat,
        IF_FOE_INITIATES_COMBAT_OR_IF_FOES_HP_GTE_75_PERCENT_AT_START_OF_COMBAT(
            // inflicts penalty on foe's Atk/Def during combat = 6 + number of allies within 3 spaces of unit × 3 (max 15),
            new NumThatIsNode(
                new InflictsStatsMinusOnFoeDuringCombatNode(READ_NUM_NODE, 0, READ_NUM_NODE, 0),
                new EnsureMaxNode(
                    ADD_NODE(6, MULT_NODE(new NumOfTargetsAlliesWithinNSpacesNode(3), 3)),
                    15,
                ),
            ),
            // reduces the effect of【Deep Wounds】by 50% during combat,
            new ReducesEffectOfDeepWoundsOnTargetByXPercentDuringCombatNode(50),
            new AppliesSkillEffectsAfterStatusFixedNode(
                // deals damage = 20% of unit's Def (including when dealing damage with a Special triggered before combat),
                new UnitDealsDamageExcludingAoeSpecialsNode(MULT_TRUNC_NODE(0.2, UNITS_DEF_DURING_COMBAT_NODE)),
                // reduces damage from foe's attacks by 20% of unit's Def (including when taking damage with a Special triggered before combat),
                new ReducesDamageExcludingAoeSpecialsNode(MULT_TRUNC_NODE(0.2, UNITS_DEF_DURING_COMBAT_NODE)),
            ),
        ),
    ));

    BEFORE_AOE_SPECIAL_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // deals damage = 20% of unit's Def (including when dealing damage with a Special triggered before combat),
        new UnitDealsDamageBeforeCombatNode(MULT_TRUNC_NODE(0.2, UNITS_DEF_AT_START_OF_COMBAT_NODE)),
        // reduces damage from foe's attacks by 20% of unit's Def (including when taking damage with a Special triggered before combat),
        new ReducesDamageBeforeCombatNode(MULT_TRUNC_NODE(0.2, UNITS_DEF_AT_START_OF_COMBAT_NODE)),
    ));

    // At start of turn,
    // if unit is adjacent to only beast or dragon allies or if unit is not adjacent to any ally,
    // unit transforms (otherwise,
    // unit reverts). If unit transforms,
    // grants Atk+2,
    // deals +7 damage when Special triggers,
    // and neutralizes effects that grant "Special cooldown charge +X" to foe or inflict "Special cooldown charge -X" on unit.
    setBeastSkill(skillId, BeastCommonSkillType.Infantry2);
}

// 紋章士シグルド
{
    let skillId = getEmblemHeroSkillId(EmblemHero.Sigurd);
    // Enables [Canto (X)] . If unit's Range = 1, X = 3; otherwise, X = 2.
    CAN_TRIGGER_CANTO_HOOKS.addSkill(skillId, () => TRUE_NODE);
    CALCULATES_DISTANCE_OF_CANTO_HOOKS.addSkill(skillId, () => new CantoXNode());

    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of turn,
        // 1 turn (does not stack; excludes cavalry with Range = 2).
        UNLESS_NODE(IS_TARGET_CAVALRY_WITH_RANGE_2_NODE,
            // grants "unit can move 1 extra space" to unit for
            new GrantsStatusEffectsAtStartOfTurnNode(StatusEffectType.MobilityIncreased),
        ),
    ));

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // Boosts Special damage by
        new BoostsDamageWhenSpecialTriggersNode(
            // number of spaces from start position to end position of whoever initiated combat (max 4) × 2.
            MULT_NODE(
                new EnsureMaxNode(NUMBER_OF_SPACES_FROM_START_POSITION_TO_END_POSITION_OF_WHOEVER_INITIATED_COMBAT,
                    4),
                2),
        ),
    ));
}

// 助走4
{
    let skillId = PassiveB.Momentum4;
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit or foe initiates combat after moving to a different space,
        IF_NODE(new IfUnitOrFoeInitiatesCombatAfterMovingToADifferentSpaceNode(),
            // inflicts Atk/Def-4 on foe,
            new InflictsStatsMinusOnFoeDuringCombatNode(4, 0, 4, 0),
            // unit makes a guaranteed follow-up attack,
            UNIT_MAKES_GUARANTEED_FOLLOW_UP_ATTACK_NODE,
            // and deals damage during combat =
            new UnitDealsDamageExcludingAoeSpecialsNode(
                // number of spaces from start position to end position of whoever initiated combat × 4
                // (max 20; including when dealing damage with a Special triggered before combat).
                new EnsureMaxNode(MULT_NODE(NUM_OF_SPACES_START_TO_END_OF_WHOEVER_INITIATED_COMBAT_NODE, 4), 20),
            ),
        ),
        // if unit has a Special that triggers when unit attacks
        // (excluding area-of-effect Specials),
        IF_NODE(new CanTargetsAttackTriggerTargetsSpecialNode(),
            // grants Special cooldown count-X to unit before unit's first attack during combat
            new GrantsSpecialCooldownCountMinusNToTargetBeforeTargetsFirstAttackDuringCombatNode(
                // (if number of spaces from start position to end position > 3, X = 2; otherwise, X = 1).
                COND_OP(GTE_NODE(new NumOfTargetsMovingSpacesNode(), 3), 2, 1),
            ),
        ),
    ));

    BEFORE_AOE_SPECIAL_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        IF_NODE(new IfUnitOrFoeInitiatesCombatAfterMovingToADifferentSpaceNode(),
            // and deals damage during combat =
            new UnitDealsDamageExcludingAoeSpecialsNode(
                // number of spaces from start position to end position of whoever initiated combat × 4
                // (max 20; including when dealing damage with a Special triggered before combat).
                new EnsureMaxNode(MULT_NODE(NUM_OF_SPACES_START_TO_END_OF_WHOEVER_INITIATED_COMBAT_NODE, 4), 20),
            ),
        ),
    ));

    BEFORE_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit initiates combat after moving to a different space,
        // TODO: rename and make alias
        IF_NODE(AND_NODE(DOES_UNIT_INITIATE_COMBAT_NODE,
                GTE_NODE(new NumOfTargetsMovingSpacesNode(), 1)),
            // triggers the following effects depending on unit's equipped Special:
            // if unit has an area-of-effect Special equipped,
            IF_NODE(new HasTargetAoeSpecialNode(),
                new NumThatIsNode(
                    // grants Special cooldown count-X to unit before Special triggers before combat (excluding Rokkr area-of-effect Specials);
                    new GrantsSpecialCooldownCountMinusNToTargetBeforeSpecialTriggersBeforeCombatNode(READ_NUM_NODE),
                    // (if number of spaces from start position to end position > 3, X = 2; otherwise, X = 1).
                    COND_OP(GTE_NODE(new NumOfTargetsMovingSpacesNode(), 3), 2, 1),
                ),
            ),
        ),
    ))
}

// オーバードライヴ
{
    let skillId = Special.Override;

    // 範囲奥義
    // If unit's Special is ready, before combat this unit initiates,
    // foes in an area near target take damage equal to 1.5 x (unit's Atk minus foe's Def or Res).
    RANGED_ATTACK_SPECIAL_SET.add(skillId);
    RANGED_ATTACK_SPECIAL_DAMAGE_RATE_MAP.set(skillId, 1.5);

    // 十字範囲
    AOE_SPECIAL_SPACES_HOOKS.addSkill(skillId, () =>
        new OverrideAoeSpacesNode(),
    );

    // When unit deals damage to 2 or more foes at the same time using a Special (including target; including foes dealt 0 damage),
    // grants another action to unit after combat (once per turn).
    AFTER_COMBAT_FOR_ANOTHER_ACTION_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        IF_NODE(new DoesTargetDealDamageTo2OrMoreTargetsFoesAtTheSameTimeUsingSpecialNode(),
            // grants another action to unit,
            TARGETS_ONCE_PER_TURN_SKILL_EFFECT_NODE(`${skillId}-再行動`, GRANTS_ANOTHER_ACTION_NODE),
        ),
    ));

    AT_APPLYING_ONCE_PER_COMBAT_DAMAGE_REDUCTION_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit's or foe's Special is ready or triggered before or during this combat,
        IF_NODE(IS_THE_UNITS_OR_FOES_SPECIAL_READY_OR_WAS_THE_UNITS_OR_FOES_SPECIAL_TRIGGERED_BEFORE_OR_DURING_THIS_COMBAT,
            // reduces damage from foe's next attack by 40% during combat (once per combat; excluding area-of-effect Specials).
            new ReducesDamageFromTargetsFoesNextAttackByNPercentOncePerCombatNode(40),
        ),
    ));
}

// 聖騎士の槍
{
    let skillId = Weapon.HolyWarSpear;
    // Enables (Canto (3)] .
    CAN_TRIGGER_CANTO_HOOKS.addSkill(skillId, () => TRUE_NODE);
    CALCULATES_DISTANCE_OF_CANTO_HOOKS.addSkill(skillId, () => new ConstantNumberNode(3));
    // Accelerates Special trigger (cooldown count-1).
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At the start of turn, grants [Gallop) to unit.
        new GrantsStatusEffectsAtStartOfTurnNode(StatusEffectType.Gallop),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit initiates combat or is within 2 spaces of an ally,
        IF_UNIT_INITIATES_COMBAT_OR_IS_WITHIN_2_SPACES_OF_AN_ALLY(
            // grants bonus to unit's Atk/Spd/Def/Res = 5 + number of foes within 3 rows or 3 columns centered on unit × 3 (max 14),
            new GrantsAllStatsPlusNToUnitDuringCombatNode(
                new EnsureMaxNode(
                    ADD_NODE(5, MULT_NODE(NUM_OF_FOES_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_UNIT_NODE, 3)),
                    14,
                )
            ),
            // deals damage = 20% of unit's Def (including when dealing damage with a Special triggered before combat), and
            new AppliesSkillEffectsAfterStatusFixedNode(
                new UnitDealsDamageExcludingAoeSpecialsNode(MULT_TRUNC_NODE(0.2, UNITS_DEF_DURING_COMBAT_NODE)),
            ),
            // reduces the percentage of foe's non-Special "reduce damage by X%" skills by 50% during combat (excluding area-of-effect Specials), and
            REDUCES_PERCENTAGE_OF_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE,
            // restores 7 HP to unit after combat.
            RESTORES_7_HP_TO_UNIT_AFTER_COMBAT_NODE,
        ),
    ));
    BEFORE_AOE_SPECIAL_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        IF_UNIT_INITIATES_COMBAT_OR_IS_WITHIN_2_SPACES_OF_AN_ALLY(
            // deals damage = 20% of unit's Def (including when dealing damage with a Special triggered before combat), and
            new UnitDealsDamageBeforeCombatNode(MULT_TRUNC_NODE(0.2, UNITS_DEF_AT_START_OF_COMBAT_NODE)),
        ),
    ))
}

// 備え3
{
    let setSkill = (skillId, spurs) => {
        AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () =>
            SKILL_EFFECT_NODE(
                // If【Bonus】is active on unit,
                IF_NODE(IS_BONUS_ACTIVE_ON_UNIT_NODE,
                    X_NUM_NODE(
                        // grants Atk/Def+X to unit during combat
                        new GrantsStatsPlusToUnitDuringCombatNode(...spurs),
                        // (X = number of【Bonus】effects active on unit, excluding stat bonuses, × 2, + 3; max 7).
                        new EnsureMaxNode(ADD_NODE(MULT_NODE(NUM_OF_BONUS_ON_UNIT_EXCLUDING_STAT_NODE, 2), 3), 7),
                    ),
                )
            )
        );
    };
    setSkill(PassiveA.AtkSpdPrime3, [READ_NUM_NODE, READ_NUM_NODE, 0, 0]);
    setSkill(PassiveA.AtkDefPrime3, [READ_NUM_NODE, 0, READ_NUM_NODE, 0]);
}

// 称賛の希求の大斧
{
    let skillId = Weapon.PraisePinerAxe;
    // Effective against flying foes. Grants Def+3.
    // Calculates damage using the lower of foe's Def or Res.
    CALCULATES_DAMAGE_USING_THE_LOWER_OF_FOES_DEF_OR_RES_SKILL(skillId);
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of turn,
        // if unit's HP ≥ 25%,
        IF_NODE(IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_TURN_NODE,
            // to unit and allies within 2 spaces of unit for 1 turn.
            new ForEachTargetAndTargetsAllyWithin2SpacesOfTargetNode(TRUE_NODE,
                // grants Def/Res+6 and
                new GrantsStatsPlusAtStartOfTurnNode(0, 0, 6, 6),
                // "neutralizes foe's bonuses during combat"
                new GrantsStatusEffectsAtStartOfTurnNode(StatusEffectType.NeutralizesFoesBonusesDuringCombat),
            ),
        ),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If foe initiates combat or foe's HP ≥ 75% at start of combat,
        IF_NODE(OR_NODE(DOES_FOE_INITIATE_COMBAT_NODE, IS_FOES_HP_GTE_75_PERCENT_AT_START_OF_COMBAT_NODE),
            new NumThatIsNode(
                // inflicts penalty on foe's Atk/Def/Res = 5 + 15% of unit's Def at start of combat and
                new InflictsStatsMinusOnFoeDuringCombatNode(READ_NUM_NODE, 0, READ_NUM_NODE, READ_NUM_NODE),
                ADD_NODE(5, MULT_TRUNC_NODE(0.15, UNITS_DEF_AT_START_OF_COMBAT_NODE)),
            ),
            new AppliesSkillEffectsAfterStatusFixedNode(
                // reduces damage from foe's attacks by 15% of unit's Def during combat (excluding area-of-effect Specials),
                new ReducesDamageExcludingAoeSpecialsNode(MULT_TRUNC_NODE(0.15, UNITS_DEF_DURING_COMBAT_NODE)),
            ),
            // and also,
            // if unit's HP > 1 and foe would reduce unit's HP to 0,
            // unit survives with 1 HP (once per combat; does not stack with non-Special effects that allow unit to survive with 1 HP if foe's attack would reduce HP to 0).
            new TargetCanActivateNonSpecialMiracleNode(0),
            // If foe initiates combat or foe's HP ≥ 75% at start of combat,
            IF_NODE(OR_NODE(DOES_FOE_INITIATE_COMBAT_NODE, IS_FOES_HP_GTE_75_PERCENT_AT_START_OF_COMBAT_NODE),
                // restores 7 HP to unit after combat.
                RESTORES_7_HP_TO_UNIT_AFTER_COMBAT_NODE,
            )
        ),
    ));
}

// 影助
{
    let setSkill = (skillId, cantoAssistNode) => {
        // When Canto triggers,
        WHEN_CANTO_TRIGGERS_HOOKS.addSkill(skillId, () => new SkillEffectNode(
            // enables unit to use 【Reposition】on ally
            cantoAssistNode,
            // new EnablesTargetToUseCantoAssistOnTargetsAllyNode(AssistType.Move, CantoSupport.Reposition, 1),
            // new EnablesTargetToUseCantoAssistOnTargetsAllyNode(AssistType.Move, CantoSupport.Swap, 3),
            // new EnablesTargetToUseCantoAssistOnTargetsAllyNode(AssistType.Move, CantoSupport.Shove, 1),
            // new EnablesTargetToUseCantoAssistOnTargetsAllyNode(AssistType.Move, CantoSupport.Smite, 1),
            // new EnablesTargetToUseCantoAssistOnTargetsAllyNode(AssistType.Refresh, CantoSupport.SingDance, 1),
            // (this effect is not treated as an Assist skill; if similar effects are active, this effect does not trigger).
        ));
        AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
            // If unit is within 3 spaces of an ally,
            IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_TARGETS_ALLY_NODE,
                // grants Atk/Spd/Def/Res+3 to unit during combat
                new GrantsAllStatsPlusNToUnitDuringCombatNode(3),
                // and restores 7 HP to unit after combat.
                RESTORES_7_HP_TO_UNIT_AFTER_COMBAT_NODE,
            )
        ));
    }
    // 引き戻し
    setSkill(PassiveC.ShadowShift4,
        ENABLES_TARGET_TO_USE_CANTO_ASSIST_ON_TARGETS_ALLY_NODE(AssistType.Move, CantoSupport.Reposition, 1));
    // ぶちかまし
    setSkill(PassiveC.ShadowSmite4,
        ENABLES_TARGET_TO_USE_CANTO_ASSIST_ON_TARGETS_ALLY_NODE(AssistType.Move, CantoSupport.Smite, 1));
}

// 連魔弾
{
    let skillId = Special.SeidrBurst;
    // 通常攻撃奥義(範囲奥義・疾風迅雷などは除く)
    NORMAL_ATTACK_SPECIAL_SET.add(skillId);

    // 奥義カウント設定(ダメージ計算機で使用。奥義カウント2-4の奥義を設定)
    COUNT3_SPECIALS.push(skillId);
    INHERITABLE_COUNT3_SPECIALS.push(skillId);

    WHEN_APPLIES_SPECIAL_EFFECTS_AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // Boosts damage by 50% of unit's Spd and
        new BoostsDamageWhenSpecialTriggersNode(
            MULT_TRUNC_NODE(0.5, UNITS_SPD_DURING_COMBAT_NODE),
        ),
        // calculates damage using the lower of foe's Def or Res when Special triggers.
        new CalculatesDamageUsingTheLowerOfTargetsFoesDefOrResWhenSpecialTriggersNode(),
    ));

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // On turns 1 through 4,
        IF_NODE(LTE_NODE(CURRENT_TURN_NODE, 4),
            // grants Special cooldown count-2 to unit before unit's first attack and
            new GrantsSpecialCooldownCountMinusNToTargetBeforeTargetsFirstAttackDuringCombatNode(2),
            // grants Special cooldown count-2 to unit before unit's first follow-up attack during combat.
            new GrantsSpecialCooldownCountMinusNToTargetBeforeTargetsFirstFollowUpAttackDuringCombatNode(2),
        ),
    ));

    AT_APPLYING_ONCE_PER_COMBAT_DAMAGE_REDUCTION_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit's or foe's Special is ready or triggered before or during this combat,
        IF_NODE(IS_THE_UNITS_OR_FOES_SPECIAL_READY_OR_WAS_THE_UNITS_OR_FOES_SPECIAL_TRIGGERED_BEFORE_OR_DURING_THIS_COMBAT,
            // reduces damage from foe's next attack by 40% (once per combat; excluding area-of-effect Specials).
            new ReducesDamageFromTargetsFoesNextAttackByNPercentOncePerCombatNode(40),
        ),
    ));
}

// ニザヴェリルの理槍
{
    let skillId = Weapon.DvergrWayfinder;
    // Accelerates Special trigger (cooldown count-1).
    // Enables【Canto (Dist. +2; Max ５)】 during turns 1 through 4.
    CAN_TRIGGER_CANTO_HOOKS.addSkill(skillId, () => LTE_NODE(CURRENT_TURN_NODE, 4));
    CALCULATES_DISTANCE_OF_CANTO_HOOKS.addSkill(skillId, () => new CantoDistNode(2, 5));

    FOR_ALLIES_GRANTS_STATS_PLUS_TO_ALLIES_DURING_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // During turns 1 through 4,
        IF_NODE(LTE_NODE(CURRENT_TURN_NODE, 4),
            // for allies within 3 rows or 3 columns centered on unit,
            IF_NODE(IS_TARGET_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_SKILL_OWNER_NODE,
                // grants Atk/Spd+4,
                new GrantsStatsPlusToTargetDuringCombatNode(4, 4, 0, 0),
            )
        ),
    ));

    FOR_ALLIES_GRANTS_EFFECTS_TO_ALLIES_DURING_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // During turns 1 through 4,
        IF_NODE(LTE_NODE(CURRENT_TURN_NODE, 4),
            // for allies within 3 rows or 3 columns centered on unit,
            IF_NODE(IS_TARGET_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_SKILL_OWNER_NODE,
                // if ally's attack can trigger ally's Special,
                IF_NODE(new CanTargetsAttackTriggerTargetsSpecialNode(),
                    // grants Special cooldown count-1 to ally before their first attack during their combat.
                    new GrantsSpecialCooldownCountMinusNToTargetBeforeTargetsFirstAttackDuringCombatNode(1),
                ),
            )
        ),
    ));

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of combat,
        // if unit's HP ≥ 25%,
        IF_NODE(IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE,
            // grants bonus to unit's Atk/Spd/Def/Res = 5 + number of allies within 3 rows or 3 columns centered on unit × 3 (max 14),
            new GrantsAllStatsPlusNToUnitDuringCombatNode(
                new EnsureMaxNode(
                    ADD_NODE(5, MULT_NODE(NUM_OF_ALLIES_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_UNIT_NODE, 3)),
                    14,
                ),
            ),
            new AppliesSkillEffectsAfterStatusFixedNode(
                // deals damage = 20% of unit's Spd (excluding area-of-effect Specials),
                new UnitDealsDamageExcludingAoeSpecialsNode(MULT_TRUNC_NODE(0.2, UNITS_SPD_DURING_COMBAT_NODE)),
            ),
            // and reduces damage from foe's first attack by 40% during combat
            new ReducesDamageFromFoesFirstAttackByNPercentDuringCombatIncludingTwiceNode(40),
            // ("first attack" normally means only the first strike; for effects that grant "unit attacks twice," it means the first and second strikes),
            // and also,
            // when Special triggers,
            // neutralizes foe's "reduces damage by X%" effects from foe's non-Special skills (excluding when dealing damage with an area-of-effect Special).
            WHEN_SPECIAL_TRIGGERS_NEUTRALIZES_FOES_REDUCES_DAMAGE_BY_PERCENTAGE_EFFECTS_FROM_FOES_NON_SPECIAL_EXCLUDING_AOE_SPECIALS_NODE,
        ),
    ));
}

// 珍獣騎士の剣
{
    let skillId = Weapon.SuaveBlade;
    // Accelerates Special trigger (cooldown count-1).
    // If a Rally or movement Assist skill (like Reposition, Shove, Pivot, etc.) is used by unit or targets unit,
    let node = new SkillEffectNode(
        new ReservesToGrantStatusEffectsToTargetNode(
            // grants "reduces the percentage of foe's non-Special 'reduce damage by X%' skills by 50% during combat (excluding area-of-effect Specials)" and
            StatusEffectType.ReducesPercentageOfFoesNonSpecialReduceDamageSkillsBy50Percent,
            // 【Bonus Doubler】to unit and target ally or unit and targeting ally for 1 turn.
            StatusEffectType.BonusDoubler
        ),
        new ReservesToGrantStatusEffectsToAssistAllyNode(
            // grants "reduces the percentage of foe's non-Special 'reduce damage by X%' skills by 50% during combat (excluding area-of-effect Specials)" and
            StatusEffectType.ReducesPercentageOfFoesNonSpecialReduceDamageSkillsBy50Percent,
            // 【Bonus Doubler】to unit and target ally or unit and targeting ally for 1 turn.
            StatusEffectType.BonusDoubler
        ),
    );
    AFTER_RALLY_SKILL_IS_USED_BY_UNIT_HOOKS.addSkill(skillId, () => node);
    AFTER_RALLY_SKILL_IS_USED_BY_ALLY_HOOKS.addSkill(skillId, () => node);
    AFTER_MOVEMENT_SKILL_IS_USED_BY_UNIT_HOOKS.addSkill(skillId, () => node);
    AFTER_MOVEMENT_SKILL_IS_USED_BY_ALLY_HOOKS.addSkill(skillId, () => node);

    // If a Rally or movement Assist skill is used by unit, grants another action to unit (once per turn).
    let anotherActionNode = new GrantsAnotherActionToTargetOnAssistNode();
    AFTER_RALLY_ENDED_BY_UNIT_HOOKS.addSkill(skillId, () => anotherActionNode);
    AFTER_MOVEMENT_ASSIST_ENDED_BY_UNIT_HOOKS.addSkill(skillId, () => anotherActionNode);

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit initiates combat or is within 2 spaces of an ally,
        IF_UNIT_INITIATES_COMBAT_OR_IS_WITHIN_2_SPACES_OF_AN_ALLY(
            // grants bonus to unit's Atk/Spd/Def/Res = 5 + number of allies within 3 rows or 3 columns centered on unit × 3 (max 14),
            new GrantsAllStatsPlusNToUnitDuringCombatNode(
                new EnsureMaxNode(
                    ADD_NODE(5, MULT_NODE(NUM_OF_ALLIES_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_UNIT_NODE, 3)),
                    14,
                )
            ),
            // neutralizes effects that guarantee foe's follow-up attacks and effects that prevent unit's follow-up attacks,
            NULL_UNIT_FOLLOW_UP_NODE,
            // and reduces damage from foe's first attack by
            new ReducesDamageFromFoesFirstAttackByNDuringCombatIncludingTwiceNode(
                new EnsureMaxNode(
                    // number of 【Bonus】effects active on unit, excluding stat bonuses, × 3 during combat
                    MULT_NODE(NUM_OF_BONUS_ON_UNIT_EXCLUDING_STAT_NODE, 3),
                    // (max 15; excluding area-of-effect Specials; "first attack" normally means only the first strike; for effects that grant "unit attacks twice," it means the first and second strikes).
                    15,
                )
            ),
        )
    ));
}

// 自警団長の弓
{
    let skillId = Weapon.SentinelBow;
    // Accelerates Special trigger (cooldown count-1). Effective against flying foes.
    BEFORE_AOE_SPECIAL_ACTIVATION_CHECK_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit initiates combat or foe's Range = 2,
        IF_NODE(OR_NODE(DOES_UNIT_INITIATE_COMBAT_NODE, FOES_RANGE_IS_2_NODE),
            // foe cannot trigger Specials during combat or area-of-effect Specials (excluding Røkkr area-of-effect Specials).
            FOE_CANNOT_TRIGGER_AREA_OF_EFFECT_SPECIALS_NODE,
        )
    ));

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit initiates combat or foe's Range = 2,
        IF_NODE(OR_NODE(DOES_UNIT_INITIATE_COMBAT_NODE, FOES_RANGE_IS_2_NODE),
            // foe cannot trigger Specials during combat or area-of-effect Specials (excluding Røkkr area-of-effect Specials).
            FOE_CANNOT_TRIGGER_SPECIALS_DURING_COMBAT_NODE,
            // grants bonus to unit's Atk/Spd/Def/Res = 5 + 15% of unit's Spd at start of combat,
            new GrantsAllStatsPlusNToTargetDuringCombatNode(
                ADD_NODE(5, MULT_TRUNC_NODE(0.15, UNITS_SPD_AT_START_OF_COMBAT_NODE)),
            ),
            // reduces the percentage of foe's non-Special "reduce damage by X%" skills by 50% (excluding area-of-effect Specials),
            REDUCES_PERCENTAGE_OF_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE,
            // neutralizes effects that guarantee foe's follow-up attacks and effects that prevent unit's follow-up attacks,
            NULL_UNIT_FOLLOW_UP_NODE,
            // and reduces damage from foe's first attack by 70% during combat
            new ReducesDamageFromFoesFirstAttackByNPercentDuringCombatIncludingTwiceNode(70),
            // ("first attack" normally means only the first strike; for effects that grant "unit attacks twice," it means the first and second strikes),
            // and unit's next attack deals damage = total damage reduced from foe's first attack (by any source,
            TARGETS_NEXT_ATTACK_DEALS_DAMAGE_EQ_TOTAL_DAMAGE_REDUCED_FROM_TARGETS_FOES_FIRST_ATTACK_NODE,
            // including other skills). Resets at end of combat.
        ),
    ));
}

// 響・始まりの鼓動
{
    let skillId = PassiveX.TimePulseEcho;
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // TODO: おそらくIF_TARGETS_SPECIAL_COOLDOWN_COUNT_IS_AT_ITS_MAXIMUM_VALUE_GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_X_NODEでも良いので確認する
        // At start of turn,
        // if Special cooldown count is at its maximum value, grants Special cooldown count-1.
        AT_START_OF_TURN_IF_TARGETS_SPECIAL_COOLDOWN_COUNT_IS_AT_ITS_MAXIMUM_VALUE_GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_X_NODE(1),
    ));

    AFTER_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // After combat,
        // if Special cooldown count is at its maximum value, grants Special cooldown count-1.
        IF_TARGETS_SPECIAL_COOLDOWN_COUNT_IS_AT_ITS_MAXIMUM_VALUE_GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_X_NODE(1),
    ))
}

// 砂陣
{
    let skillId = Special.Sandstorm;
    // 通常攻撃奥義(範囲奥義・疾風迅雷などは除く)
    NORMAL_ATTACK_SPECIAL_SET.add(skillId);

    // 奥義カウント設定(ダメージ計算機で使用。奥義カウント2-4の奥義を設定)
    COUNT4_SPECIALS.push(skillId);
    INHERITABLE_COUNT4_SPECIALS.push(skillId);

    WHEN_APPLIES_SPECIAL_EFFECTS_AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // Boosts damage by 80% of unit's Def and
        new BoostsDamageWhenSpecialTriggersNode(
            MULT_TRUNC_NODE(0.8, UNITS_DEF_DURING_COMBAT_NODE),
        ),
    ));

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // calculates damage using 150% of unit's Def instead of the value of unit's Atk when Special triggers.
        new CalculatesDamageUsingXPercentOfTargetsStatInsteadOfAtkWhenSpecialNode(STATUS_INDEX.Def, 150),
    ));

    AT_START_OF_ATTACK_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // Reduces damage from attacks by percentage = 40 - current Special cooldown count value × 10 during combat.
        new ReducesDamageFromAttacksDuringCombatByXPercentAsSpecialSkillEffectPerAttackNode(
            SUB_NODE(40, MULT_NODE(10, UNITS_CURRENT_SPECIAL_COOLDOWN_COUNT_DURING_COMBAT))
        ),
    ));

    WHEN_APPLIES_EFFECTS_AFTER_COMBAT_STATS_DETERMINED_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit's Def > foe's Def,
        IF_NODE(UNITS_DEF_GT_FOES_DEF_DURING_COMBAT_NODE,
            new NumThatIsNode(
                new SkillEffectNode(
                    // decreases Spd difference necessary for unit to make a follow-up attack by X and
                    new DecreasesSpdDiffNecessaryForUnitFollowUpNode(READ_NUM_NODE),
                    // increases Spd difference necessary for foe to make a follow-up attack by X during combat
                    new IncreasesSpdDiffNecessaryForTargetsFoesFollowUpNode(READ_NUM_NODE),
                ),
                // (X = difference between Def stats; max 10;
                new EnsureMaxNode(DIFFERENCE_BETWEEN_DEF_STATS_NODE, 10),
                // for example, if Spd difference necessary increases by 10, Spd must be ≥ 15 more than foe's Spd to make a follow-up attack; stacks with similar skills).
            ),
        ),
    ));
}

// 闘いの熱砂の槍
{
    let skillId = Weapon.DesertSpear;
    // Accelerates Special trigger (cooldown count-1). Unit can counterattack regardless of foe's range.
    // Foes with Range = 1 cannot move through spaces adjacent to unit (does not affect foes with Pass skills).
    CANNOT_FOE_MOVE_THROUGH_SPACES_ADJACENT_TO_UNIT_HOOKS.addSkill(skillId, () =>
        TRUE_NODE,
    )
    // Foes with Range = 2 cannot move through spaces within 2 spaces of unit (does not affect foes with Pass skills).
    CANNOT_FOE_MOVE_THROUGH_SPACES_WITHIN_2_SPACES_OF_UNIT_HOOKS.addSkill(skillId, () =>
        EQ_NODE(new TargetsRangeNode(), 2),
    )
    FOR_ALLIES_GRANTS_STATS_PLUS_TO_ALLIES_DURING_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // For allies within 3 spaces of unit,
        IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_SKILL_OWNER_NODE,
            // grants Spd/Def+4 during combat,
            new GrantsStatsPlusToTargetDuringCombatNode(0, 4, 4, 0),
        ),
    ));
    // and also,
    FOR_ALLIES_GRANTS_EFFECTS_TO_ALLIES_DURING_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // For allies within 3 spaces of unit,
        IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_SKILL_OWNER_NODE,
            // when foe's attack triggers foe's Special,
            // reduces damage from foe's attacks by 10 during that ally's combat (excluding area-of-effect Specials).
            new ReducesDamageWhenFoesSpecialExcludingAoeSpecialNode(10),
        ),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit is within 3 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_TARGETS_ALLY_NODE,
            // grants bonus to unit's Atk/Spd/Def/Res = 5 + 15% of unit's Def at start of combat,
            new GrantsAllStatsPlusNToUnitDuringCombatNode(
                ADD_NODE(5, MULT_TRUNC_NODE(0.15, UNITS_DEF_AT_START_OF_COMBAT_NODE)),
            ),
            // and neutralizes foe's bonuses (from skills like Fortify, Rally, etc.) during combat,
            NEUTRALIZES_FOES_BONUSES_TO_STATS_DURING_COMBAT_NODE,
            // and also,
            // when foe's attack triggers foe's Special,
            // reduces damage from foe's attacks by 10 during combat (excluding area-of-effect Specials).
            new ReducesDamageWhenFoesSpecialExcludingAoeSpecialNode(10),
        ),
    ));
}

// 生命の業火
{
    let setSkill = (skillId, grantsNode) => {
        AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => BOOST_3_NODE(grantsNode));
    };

    // 生命の業火疾風3
    setSkill(PassiveA.FirestormBoost3, new GrantsStatsPlusToTargetDuringCombatNode(7, 7, 0, 0));
    // 生命の業火静水3
    setSkill(PassiveA.FirefloodBoost3, new GrantsStatsPlusToTargetDuringCombatNode(7, 0, 0, 7));
    // 生命の業火大地3
    setSkill(PassiveA.EarthfireBoost3, new GrantsStatsPlusToTargetDuringCombatNode(7, 0, 7, 0));
    // 生命の疾風大地3
    setSkill(PassiveA.EarthwindBoost3, new GrantsStatsPlusToTargetDuringCombatNode(0, 7, 7, 0));
    // 生命の疾風静水3
    setSkill(PassiveA.DelugeBoost3, new GrantsStatsPlusToTargetDuringCombatNode(0, 7, 0, 7));
}

// 賀正の人狼王の爪牙
{
    let skillId = getNormalSkillId(Weapon.ResolvedFang);
    // Grants Def+3.

    // At start of turn,
    // if unit is adjacent to only beast or dragon allies or if unit is not adjacent to any ally,
    // unit transforms (otherwise,
    // unit reverts). If unit transforms,
    // grants Atk+2 and deals +10 damage when Special triggers.
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of combat,
        // if foe's HP ≥ 75%,
        IF_NODE(IS_FOES_HP_GTE_75_PERCENT_AT_START_OF_COMBAT_NODE,
            // grants Def+5 to unit,
            new GrantsStatsPlusToTargetDuringCombatNode(0, 0, 5, 0),
            // inflicts Def-5 on foe during combat,
            new InflictsStatsMinusOnFoeDuringCombatNode(0, 0, 5, 0),
            // and then,
            new AppliesSkillEffectsAfterStatusFixedNode(
                // if unit's Def > foe's Def,
                IF_NODE(GT_NODE(UNITS_EVAL_DEF_DURING_COMBAT_NODE, FOES_EVAL_DEF_DURING_COMBAT_NODE),
                    // deals damage = 70% of difference between stats. (Maximum bonus of +7 damage.)
                    new UnitDealsDamageExcludingAoeSpecialsNode(
                        new EnsureMaxNode(
                            MULT_TRUNC_NODE(0.7,
                                SUB_NODE(UNITS_EVAL_DEF_DURING_COMBAT_NODE, FOES_EVAL_DEF_DURING_COMBAT_NODE)),
                            7),
                    ),
                ),
            ),
        ),
    ));
    BEFORE_AOE_SPECIAL_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // if unit's Def > foe's Def,
        IF_NODE(GT_NODE(UNITS_EVAL_DEF_AT_START_OF_COMBAT_NODE, FOES_EVAL_DEF_AT_START_OF_COMBAT_NODE),
            // deals damage = 70% of difference between stats. (Maximum bonus of +7 damage.)
            new UnitDealsDamageBeforeCombatNode(
                new EnsureMaxNode(
                    MULT_TRUNC_NODE(0.7,
                        SUB_NODE(UNITS_EVAL_DEF_AT_START_OF_COMBAT_NODE, FOES_EVAL_DEF_AT_START_OF_COMBAT_NODE)),
                    7),
            ),
        ),
    ));
}
{
    let skillId = getRefinementSkillId(Weapon.ResolvedFang);
    // Grants Def+3.
    // At start of turn,
    // if unit is adjacent to only beast or dragon allies or if unit is not adjacent to any ally,
    // unit transforms (otherwise,
    // unit reverts). If unit transforms,
    // grants Atk+2,
    // deals +7 damage when Special triggers,
    // and neutralizes effects that grant "Special cooldown charge +X" to foe or inflict "Special cooldown charge -X" on unit.
    setBeastSkill(skillId, BeastCommonSkillType.Infantry2);

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If foe initiates combat or foe's HP ≥ 75% at start of combat,
        IF_NODE(OR_NODE(DOES_FOE_INITIATE_COMBAT_NODE, IS_FOES_HP_GTE_75_PERCENT_AT_START_OF_COMBAT_NODE),
            // grants Spd/Def/Res+5 to unit,
            new GrantsStatsPlusToTargetDuringCombatNode(0, 5, 5, 5),
            // inflicts Def-5 on foe,
            new InflictsStatsMinusOnFoeDuringCombatNode(0, 0, 5, 0),
            new AppliesSkillEffectsAfterStatusFixedNode(
                // deals damage = 20% of unit's Def (including when dealing damage with a Special triggered before combat),
                new UnitDealsDamageExcludingAoeSpecialsNode(
                    MULT_TRUNC_NODE(0.2, UNITS_EVAL_DEF_DURING_COMBAT_NODE),
                ),
            ),
            // unit makes a guaranteed follow-up attack,
            UNIT_MAKES_GUARANTEED_FOLLOW_UP_ATTACK_NODE,
            // and neutralizes unit's penalties to Atk/Def during combat.
            new NeutralizesPenaltiesToTargetsStatsNode(true, false, true, false),
        ),
    ));
    // deals damage = 20% of unit's Def (including when dealing damage with a Special triggered before combat),
    BEFORE_AOE_SPECIAL_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        IF_NODE(OR_NODE(DOES_FOE_INITIATE_COMBAT_NODE, IS_FOES_HP_GTE_75_PERCENT_AT_START_OF_COMBAT_NODE),
            new UnitDealsDamageExcludingAoeSpecialsNode(
                // deals damage = 20% of unit's Def (including when dealing damage with a Special triggered before combat),
                MULT_TRUNC_NODE(0.2, UNITS_EVAL_DEF_DURING_COMBAT_NODE),
            ),
        ),
    ));
}
{
    let skillId = getSpecialRefinementSkillId(Weapon.ResolvedFang);
    // If unit is within 3 spaces of an ally,
    // restores X HP to unit as unit's combat begins (triggers after effects that deal damage as combat begins; if unit's Def > foe's Def,
    // X = 20% of unit's max HP + difference between stats × 4; otherwise,
    // X = 20% of unit's max HP; max 40% of unit's max HP + damage dealt to unit as combat begins; only highest value applied; does not stack).
    AFTER_EFFECTS_THAT_DEAL_DAMAGE_AS_COMBAT_BEGINS_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_TARGETS_ALLY_NODE,
            RESTORE_X_HP_LIKE_BREATH_OF_LIFE_4_NODE(),
        ),
    ));

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit is within 3 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_TARGETS_ALLY_NODE,
            // grants Spd/Def/Res+5 to unit,
            new GrantsStatsPlusToTargetDuringCombatNode(0, 5, 5, 5),
            // inflicts Def-5 on foe,
            new InflictsStatsMinusOnFoeDuringCombatNode(0, 0, 5, 0),
            // reduces damage from foe's attacks by 15% of unit's Def (excluding area-of-effect Specials),
            new AppliesSkillEffectsAfterStatusFixedNode(
                new ReducesDamageExcludingAoeSpecialsNode(
                    MULT_TRUNC_NODE(FOES_ATK_DURING_COMBAT_NODE, 0.15),
                ),
            ),
            // and reduces the effect of【Deep Wounds】on unit by 50% during combat.
            new ReducesEffectOfDeepWoundsOnTargetByXPercentDuringCombatNode(50),
        ),
    ));
}

// 女神を宿せし者・承
{
    let skillId = PassiveC.GoddessBearer2;
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of turn,
        // if there is an ally within 3 rows or 3 columns centered on unit,
        IF_NODE(IS_THERE_ALLY_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_UNIT_NODE,
            // grants Atk/Spd+7,
            new GrantsStatsPlusAtStartOfTurnNode(7, 7, 0, 0),
            // 【Null Follow-Up】,
            // and "unit can move to a space adjacent to any ally within 2 spaces" to unit for 1 turn.
            new GrantsStatusEffectsAtStartOfTurnNode(StatusEffectType.NullFollowUp, StatusEffectType.AirOrders)
        ),
    ));

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If there is an ally within 3 rows or 3 columns centered on unit,
        IF_NODE(IS_THERE_ALLY_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_UNIT_NODE,
            // grants Atk/Spd/Def/Res+4 to unit and grants Special cooldown count-1 to unit before unit's first attack during combat,
            GRANTS_ALL_STATS_PLUS_4_TO_UNIT_DURING_COMBAT_NODE,
            new GrantsSpecialCooldownCountMinusNToTargetBeforeTargetsFirstAttackDuringCombatNode(1),
            // and also,
            // if foe's attack can trigger foe's Special,
            // inflicts Special cooldown count+1 on foe before foe's first attack during combat (cannot exceed foe's maximum Special cooldown).
            IF_NODE(CAN_FOES_ATTACK_TRIGGER_FOES_SPECIAL_NODE,
                new InflictsSpecialCooldownCountPlusNOnTargetsFoeBeforeTargetsFoesFirstAttackNode(1),
                INFLICTS_SPECIAL_COOLDOWN_COUNT_PLUS_N_ON_TARGETS_FOE_BEFORE_TARGETS_FOES_FIRST_ATTACK_NODE(1),
            ),
        ),
    ));
}

// それは興味深…・承
{
    let skillId = PassiveB.DivineRecreation2;
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit initiates combat or foe's HP ≥ 50% at start of combat,
        IF_NODE(OR_NODE(DOES_UNIT_INITIATE_COMBAT_NODE, new IsFoesHpGteNPercentAtStartOfCombatNode(50)),
            // inflicts Atk/Spd/Def/Res-4 on foe,
            INFLICTS_ALL_STATS_MINUS_4_ON_FOE_DURING_COMBAT_NODE,
            // reduces the percentage of foe's non-Special "reduce damage by X%" skills by 50% (excluding area-of-effect Specials),
            REDUCES_PERCENTAGE_OF_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE,
            // reduces damage from foe's first attack by 50% during combat ("first attack" normally means only the first strike; for effects that grant "unit attacks twice," it means the first and second strikes),
            new ReducesDamageFromFoesFirstAttackByNPercentDuringCombatIncludingTwiceNode(50),
            // and unit's next attack deals damage = total damage reduced from foe's first attack (by any source,
            // including other skills; resets at end of combat).
            new TargetsNextAttackDealsDamageEqTotalDamageReducedFromTargetsFoesFirstAttackNode(),
        ),
    ));
}

// 氷竜の竜石+
{
    let skillId = Weapon.IceDragonstonePlus;
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit initiates combat or is within 2 spaces of an ally,
        IF_NODE(OR_NODE(DOES_UNIT_INITIATE_COMBAT_NODE, IS_TARGET_WITHIN_2_SPACES_OF_TARGETS_ALLY_NODE),
            // grants Atk/Spd/Def/Res+5 to unit,
            GRANTS_ALL_STATS_PLUS_5_TO_UNIT_DURING_COMBAT_NODE,
            // unit makes a guaranteed follow-up attack,
            UNIT_MAKES_GUARANTEED_FOLLOW_UP_ATTACK_NODE,
            // and reduces the percentage of foe's non-Special "reduce damage by X%" skills by 50% during combat (excluding area-of-effect Specials).
            REDUCES_PERCENTAGE_OF_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE,
        ),
    ));
}

// 比翼フィヨルムの比翼効果
{
    WHEN_TRIGGERS_DUO_OR_HARMONIZED_EFFECT_HOOKS_MAP.addValue(Hero.DuoFjorm,
        new SkillEffectNode(
            new AppliesDivineVeinIceToTargetsSpaceAndSpacesWithinNSpacesOfTargetFor2TurnsNode(2),
        )
    )
}

// 連盾隊形
{
    let skillId = PassiveB.ShieldFighter;
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // Inflicts Atk/Spd-4 on foe during combat.
        new InflictsStatsMinusOnFoeDuringCombatNode(4, 4, 0, 0),
        // If foe's attack can trigger unit's Special,
        IF_NODE(new CanTargetsFoesAttackTriggerTargetsSpecialNode(),
        ),
        // triggers the following effects during combat:
        // grants Special cooldown count-1 to unit before foe's first attack;
        new GrantsSpecialCooldownCountMinusNToTargetBeforeTargetsFoesFirstAttackDuringCombatNode(1),

        // if foe's first attack triggers the "attacks twice" effect,
        // grants Special cooldown count-1 to unit before foe's second strike as well;
        new GrantsSpecialCooldownCountMinusNToTargetBeforeTargetsFoesSecondStrikeDuringCombatNode(1),

        // grants Special cooldown count-1 to unit before foe's first follow-up attack.
        new GrantsSpecialCooldownCountMinusNToTargetBeforeTargetsFoesFirstFollowUpAttackDuringCombatNode(1),

        // If foe's attack triggers unit's Special and Special has the "reduces damage by X%" effect,
        // Special triggers twice,
        // then reduces damage by 7.
        new TargetsSpecialTriggersTwiceThenReducesDamageByNNode(7),
        // Each Special trigger is calculated as a separate activation.
    ));
}

// 双氷の聖鏡
{
    let skillId = Special.DualIceMirrors;

    // 守備奥義
    DEFENSE_SPECIAL_SET.add(skillId);

    // 奥義カウント設定(ダメージ計算機で使用。奥義カウント2-4の奥義を設定)
    COUNT2_SPECIALS.push(skillId);
    INHERITABLE_COUNT2_SPECIALS.push(skillId);

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // When Special triggers,
        // if foe is 2 spaces from unit,
        IF_NODE(IS_FOE_RANGED_WEAPON_NODE,
            // reduces damage from foe's attacks by 40%.
            new WhenSpecialTriggersReducesDamageFromTargetsFoesAttacksByNPercentNode(40),
        ),
        // After Special triggers,
        // unit's next attack deals damage = total damage reduced (by any source,
        // including other skills; resets at end of combat; min 40% of unit's Res) and
        new AfterSpecialTriggersTargetsNextAttackDealsDamageEqTotalDamageReducedNode(),
        new AppliesSkillEffectsAfterStatusFixedNode(
            new AfterSpecialTriggersTargetsNextAttackDealsDamageMinNode(MULT_TRUNC_NODE(0.4, UNITS_RES_DURING_COMBAT_NODE)),
        ),
        // neutralizes foe's "reduces damage by X%" effects from foe's non-Special skills for that attack (resets at end of combat).
        new NeutralizeReducesDamageByXPercentEffectsFromTargetsFoesNonSpecialAfterDefenderSpecialNode(),
        // Unit can counterattack regardless of foe's range during combat.
        TARGET_CAN_COUNTERATTACK_REGARDLESS_OF_RANGE_NODE,
    ));
}

// 氷の聖鏡
{
    let skillId = Special.IceMirror;
    applySkillEffectForUnitFuncMap.set(skillId, function (targetUnit, enemyUnit) {
        if (enemyUnit.getActualAttackRange(targetUnit) === 2) {
            targetUnit.battleContext.canAddDamageReductionToNextAttackAfterSpecial = true;
        }
    });
}

// ニフルの氷晶の槍
{
    let skillId = Weapon.IceCrystalSpear;
    // Accelerates Special trigger (cooldown count-1).
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If foe initiates combat or if foe's HP ≥ 75% at start of combat,
        IF_NODE(OR_NODE(DOES_FOE_INITIATE_COMBAT_NODE, IS_FOES_HP_GTE_75_PERCENT_AT_START_OF_COMBAT_NODE),
            // grants bonus to unit's Atk/Spd/Def/Res = 5 + number of allies within 3 spaces of unit × 3 (max 14),
            new NumThatIsNode(
                new GrantsAllStatsPlusNToTargetDuringCombatNode(READ_NUM_NODE),
                new EnsureMaxNode(
                    ADD_NODE(5, MULT_NODE(new NumOfTargetsAlliesWithinNSpacesNode(3), 3)), 14
                ),
            ),
            // reduces damage from foe's attacks by 20% of unit's Spd (excluding area-of-effect Specials),
            new AppliesSkillEffectsAfterStatusFixedNode(
                new ReducesDamageExcludingAoeSpecialsNode(MULT_TRUNC_NODE(0.2, UNITS_SPD_DURING_COMBAT_NODE)),
            ),
            // neutralizes penalties on unit,
            NEUTRALIZES_PENALTIES_ON_UNIT_NODE,
            // and neutralizes effects that guarantee foe's follow-up attacks and effects that prevent unit's follow-up attacks during combat,
            NULL_UNIT_FOLLOW_UP_NODE,
            // and also,
            // when unit deals damage to foe during combat,
            // restores 7 HP to unit (triggers even if 0 damage is dealt).
            new WhenTargetDealsDamageDuringCombatRestoresNHpToTargetNode(7),
            // If foe with Range = 2 initiates combat,
            IF_NODE(AND_NODE(DOES_FOE_INITIATE_COMBAT_NODE, EQ_NODE(new FoesRangeNode(), 2)),
                // neutralizes effects that prevent unit's counterattacks during combat.
                new NeutralizesEffectsThatPreventTargetsCounterattacksDuringCombatNode(),
            ),
        )
    ));
}

// 氷の暗器+
{
    let skillId = Weapon.IceDaggerPlus;
    // Calculates damage using the lower of foe's Def or Res.
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit initiates combat or is within 2 spaces of an ally,
        IF_NODE(OR_NODE(DOES_UNIT_INITIATE_COMBAT_NODE, IS_TARGET_WITHIN_2_SPACES_OF_TARGETS_ALLY_NODE),
            // grants Atk/Spd/Def/Res+5 to unit,
            GRANTS_ALL_STATS_PLUS_5_TO_UNIT_DURING_COMBAT_NODE,
            // unit makes a guaranteed follow-up attack,
            UNIT_MAKES_GUARANTEED_FOLLOW_UP_ATTACK_NODE,
            // and reduces the percentage of foe's non-Special "reduce damage by X%" skills by 50% during combat (excluding area-of-effect Specials).
            REDUCES_PERCENTAGE_OF_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE,
        ),
    ));
}

// 先導の伝令・天4
{
    let skillId = PassiveC.AirOrders4;
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of turn,
        // if unit is within 2 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_2_SPACES_OF_TARGETS_ALLY_NODE,
            new ForEachTargetAndTargetsAllyWithin2SpacesOfTargetNode(EQ_NODE(new TargetsMoveTypeNode(), MoveType.Flying),
                // grants Atk/Spd+6,
                new GrantsStatsPlusAtStartOfTurnNode(6, 6, 0, 0),
                // 【Charge】,
                // and the following status to unit and flying allies within 2 spaces for 1 turn: "unit can move to a space adjacent to any ally within 2 spaces."
                new GrantsStatusEffectsAtStartOfTurnNode(StatusEffectType.Charge, StatusEffectType.AirOrders),
            ),
        ),
    ));
}

// イリアの吹雪の剣
{
    let skillId = Weapon.IlianFrostBlade;
    // Accelerates Special trigger (cooldown count-1).

    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of turn,
        // if unit is within 2 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_2_SPACES_OF_TARGETS_ALLY_NODE,
            // grants【Triangle Attack】and【Canto (１)】 to unit and allies within 2 spaces of unit for 1 turn.
            new ForEachTargetAndTargetsAllyWithin2SpacesOfTargetNode(TRUE_NODE,
                new GrantsStatusEffectsAtStartOfTurnNode(StatusEffectType.TriangleAttack, StatusEffectType.Canto1),
            )
        ),
    ));

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit initiates combat or is within 2 spaces of an ally,
        IF_NODE(OR_NODE(DOES_UNIT_INITIATE_COMBAT_NODE, IS_TARGET_WITHIN_2_SPACES_OF_TARGETS_ALLY_NODE),
            // grants bonus to unit's Atk/Spd/Def/Res = 5 + number of times Dragonflowers have been used on unit × 2 (max 15),
            new NumThatIsNode(
                new GrantsAllStatsPlusNToTargetDuringCombatNode(ADD_NODE(5, READ_NUM_NODE)),
                new EnsureMaxNode(MULT_NODE(new NumOfTargetsDragonflowersNode(), 2), 15),
            ),
            // reduces the percentage of foe's non-Special "reduce damage by X%" skills by 50% (excluding area-of-effect Specials),
            REDUCES_PERCENTAGE_OF_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE,
            // reduces damage from foe's first attack by 7 ("first attack" normally means only the first strike; for effects that grant "unit attacks twice," it means the first and second strikes),
            new ReducesDamageFromFoesFirstAttackByNDuringCombatIncludingTwiceNode(7),
            // and grants Special cooldown charge +1 to unit per attack during combat (only highest value applied; does not stack).
            new GrantsSpecialCooldownChargePlus1ToTargetPerAttackDuringCombatNode(),
        ),
    ));
}

// 氷の部族の雪斧
{
    let skillId = Weapon.IceTribeAxe;
    // Accelerates Special trigger (cooldown count-1).
    // Calculates damage using the lower of foe's Def or Res.

    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit is on a team with unit's support partner,
        IF_NODE(new IsThereUnitOnMapNode(new AreTargetAndSkillOwnerPartnersNode()),
            // at start of turn,
            // grants "neutralizes 'effective against dragons' bonuses"
            // to support partners within 3 spaces of unit for 1 turn.
            new ForEachTargetAndTargetsAllyWithinNSpacesOfTargetNode(3, new AreTargetAndSkillOwnerPartnersNode(),
                new GrantsStatusEffectsAtStartOfTurnNode(StatusEffectType.ShieldDragon),
            ),
        ),
        // If unit is not on a team with unit's support partner,
        IF_NODE(NOT_NODE(new IsThereUnitOnMapNode(new AreTargetAndSkillOwnerPartnersNode())),
            // at start of turn,
            // grants "neutralizes 'effective against dragons' bonuses" to ally with the highest Res among allies within 3 spaces of unit for 1 turn.
            new ForEachAllyWithHighestValueWithinNSpacesNode(3, TRUE_NODE, new TargetsStatAtStartOfTurnNode(STATUS_INDEX.Res),
                new GrantsStatusEffectsAtStartOfTurnNode(StatusEffectType.ShieldDragon),
            ),
        ),
    ));

    FOR_ALLIES_GRANTS_STATS_PLUS_TO_ALLIES_DURING_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // For allies within 3 spaces of unit with "neutralizes 'effective against dragons' bonuses" active,
        IF_NODE(AND_NODE(IS_TARGET_WITHIN_3_SPACES_OF_SKILL_OWNER_NODE,
                new HasTargetStatusEffectNode(StatusEffectType.ShieldDragon)),
            // grants Spd/Res+5,
            new GrantsStatsPlusToTargetDuringCombatNode(0, 5, 0, 5),
        ),
    ));

    FOR_ALLIES_GRANTS_EFFECTS_TO_ALLIES_DURING_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // For allies within 3 spaces of unit with "neutralizes 'effective against dragons' bonuses" active,
        IF_NODE(AND_NODE(IS_TARGET_WITHIN_3_SPACES_OF_SKILL_OWNER_NODE,
                new HasTargetStatusEffectNode(StatusEffectType.ShieldDragon)),
            // neutralizes penalties to Spd/Res,
            new NeutralizesPenaltiesToTargetsStatsNode(false, true, false, true),
            // and neutralizes effects that prevent those allies' counterattacks during their combat.
            new NeutralizesEffectsThatPreventTargetsCounterattacksDuringCombatNode(),
        ),
    ))

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit initiates combat,
        // or if there is an ally within 3 spaces of unit with "neutralizes 'effective against dragons' bonuses" active,
        IF_NODE(OR_NODE(DOES_UNIT_INITIATE_COMBAT_NODE,
                new IsTargetWithinNSpacesOfTargetsAllyNode(3,
                    new HasTargetStatusEffectNode(StatusEffectType.ShieldDragon))),
            // grants bonus to unit's Atk/Spd/Def/Res = 5 + 15% of unit's Spd at start of combat,
            new GrantsAllStatsPlusNToTargetDuringCombatNode(
                ADD_NODE(5, MULT_TRUNC_NODE(0.15, UNITS_SPD_AT_START_OF_COMBAT_NODE))),
            // deals damage = 20% of unit's Spd (excluding area-of-effect Specials),
            new AppliesSkillEffectsAfterStatusFixedNode(
                new UnitDealsDamageExcludingAoeSpecialsNode(MULT_TRUNC_NODE(0.2, UNITS_SPD_DURING_COMBAT_NODE)),
            ),
            // reduces the percentage of foe's non-Special "reduce damage by X%" skills by 50% (excluding area-of-effect Specials),
            REDUCES_PERCENTAGE_OF_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE,
            // and reduces damage from foe's first attack by 40% during combat ("first attack" normally means only the first strike; for effects that grant "unit attacks twice," it means the first and second strikes).
            new ReducesDamageFromFoesFirstAttackByNPercentDuringCombatIncludingTwiceNode(40),
        ),
    ));
}

// 盾壁隊形3
{
    let skillId = PassiveB.HardyFighter3;
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At the start of turn 1,
        IF_NODE(EQ_NODE(CURRENT_TURN_NODE, 1),
            // if foe's attack can trigger unit's Special,
            IF_NODE(new CanTargetsFoesAttackTriggerTargetsSpecialNode(),
                // grants Special cooldown count-2.
                new GrantsSpecialCooldownCountMinusOnTargetAtStartOfTurnNode(2),
            )
        ),
    ));

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // Neutralizes effects that guarantee foe's follow-up attacks during combat.
        UNIT_NEUTRALIZES_EFFECTS_THAT_GUARANTEE_FOES_FOLLOW_UP_ATTACKS_DURING_COMBAT_NODE,
        // If foe's attack triggers unit's Special and Special has the "reduces damage by X%" effect,
        // Special triggers twice,
        // then reduces damage by 5.
        new TargetsSpecialTriggersTwiceThenReducesDamageByNNode(5),
        // (Example: if Special has the "reduces damage by 50%" effect and no other damage reduction effects trigger,
        // reduces initial damage by 50%,
        // then reduces remaining damage by 50% for a total damage reduction of 75%. Remaining damage is then reduced further by 5.)
        // Each Special trigger is calculated as a separate activation.
    ));
}

// 悠遠のブレス
{
    let weapon = Weapon.RemoteBreath;
    let skillIds = [
        getNormalSkillId(weapon),
        getRefinementSkillId(weapon),
    ]
    // Accelerates Special trigger (cooldown count-1).
    // Effective against dragon foes.
    // If foe's Range = 2,
    // calculates damage using the lower of foe's Def or Res.
    AT_START_OF_COMBAT_HOOKS.addSkills(skillIds, () => new SkillEffectNode(
        // If unit is within 3 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_TARGETS_ALLY_NODE,
            // grants Atk/Spd/Def/Res+5 to unit during combat,
            GRANTS_ALL_STATS_PLUS_5_TO_UNIT_DURING_COMBAT_NODE,
            // unit makes a guaranteed follow-up attack,
            UNIT_MAKES_GUARANTEED_FOLLOW_UP_ATTACK_NODE,
            // and also,
            // if unit's attack can trigger their Special,
            IF_NODE(CAN_UNITS_ATTACK_TRIGGER_SPECIAL_NODE,
                // grants Special cooldown count-1 to unit before unit's first attack during combat,
                new GrantsSpecialCooldownCountMinusNToTargetBeforeTargetsFirstAttackDuringCombatNode(1),
                // and if foe's attack can trigger their Special and unit's Res ≥ foe's Res+5,
                IF_NODE(CAN_FOES_ATTACK_TRIGGER_FOES_SPECIAL_NODE,
                    new AppliesSkillEffectsAfterStatusFixedNode(
                        IF_NODE(GTE_NODE(
                                UNITS_EVAL_RES_DURING_COMBAT_NODE,
                                ADD_NODE(FOES_EVAL_RES_DURING_COMBAT_NODE, 5)),
                            // inflicts Special cooldown count+1 on foe before foe's first attack during combat.
                            // (Cannot exceed the foe's maximum Special cooldown.)
                            INFLICTS_SPECIAL_COOLDOWN_COUNT_PLUS_N_ON_TARGETS_FOE_BEFORE_TARGETS_FOES_FIRST_ATTACK_NODE(1),
                        ),
                    ),
                ),
            ),
        )
    ));
}
{
    let skillId = getSpecialRefinementSkillId(Weapon.RemoteBreath);
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // Unit can counterattack regardless of foe's range.
        TARGET_CAN_COUNTERATTACK_REGARDLESS_OF_RANGE_NODE,
        // At start of combat,
        // if unit's HP ≥ 25%,
        IF_NODE(IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE,
            // grants bonus to unit's Atk/Spd/Def/Res = 5 + 10% of unit's Res at start of combat,
            new GrantsAllStatsPlusNToUnitDuringCombatNode(
                ADD_NODE(5, MULT_TRUNC_NODE(0.1, UNITS_RES_AT_START_OF_COMBAT_NODE)),
            ),
            // reduces damage from foe's attacks by 20% of unit's Res (excluding area-of-effect Specials),
            new AppliesSkillEffectsAfterStatusFixedNode(
                new ReducesDamageExcludingAoeSpecialsNode(MULT_TRUNC_NODE(0.2, UNITS_RES_DURING_COMBAT_NODE)),
            ),
            // and reduces the percentage of foe's non-Special "reduce damage by X%" skills by 50% during combat (excluding area-of-effect Specials).
            REDUCES_PERCENTAGE_OF_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE,
        ),
    ));
}

// 内より溢れる魔力
{
    let skillId = getNormalSkillId(Weapon.InnerWellspring);
    // Accelerates Special trigger (cooldown count-1).
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of turn,
        // if unit is within 2 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_2_SPACES_OF_TARGETS_ALLY_NODE,
            // grants【Null Follow-Up】to unit for 1 turn,
            new GrantsStatusEffectsAtStartOfTurnNode(StatusEffectType.NullFollowUp),
            // and also,
            // if Special cooldown count is at its maximum value,
            IF_NODE(EQ_NODE(new TargetsSpecialCountAtStartOfTurnNode(), new TargetsMaxSpecialCountNode()),
                // grants Special cooldown count-1.
                new GrantsSpecialCooldownCountMinusOnTargetAtStartOfTurnNode(1),
            )
        )
    ));

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit initiates combat or is within 2 spaces of an ally,
        IF_NODE(OR_NODE(DOES_UNIT_INITIATE_COMBAT_NODE, IS_TARGET_WITHIN_2_SPACES_OF_TARGETS_ALLY_NODE),
            // grants Atk/Spd/Def/Res+5 to unit during combat and
            GRANTS_ALL_STATS_PLUS_5_TO_UNIT_DURING_COMBAT_NODE,
        ),
    ));

    AFTER_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        IF_NODE(OR_NODE(DOES_UNIT_INITIATE_COMBAT_NODE, IS_TARGET_WITHIN_2_SPACES_OF_TARGETS_ALLY_NODE),
            // if Special triggers before or during combat,
            IF_NODE(IS_UNITS_SPECIAL_TRIGGERED,
                // grants Special cooldown count-1 after combat.
                new GrantsSpecialCooldownCountMinusOnTargetAfterCombatNode(1),
            ),
        ),
    ));
}
{
    let skillId = getRefinementSkillId(Weapon.InnerWellspring);
    // Accelerates Special trigger (cooldown count-1).
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of turn,
        // if unit is within 2 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_2_SPACES_OF_TARGETS_ALLY_NODE,
            // grants【Null Follow-Up】to unit for 1 turn,
            new GrantsStatusEffectsAtStartOfTurnNode(StatusEffectType.NullFollowUp),
            // and also,
            // if unit's Special cooldown count is at its maximum value,
            // grants Special cooldown count-1 to unit.
            IF_NODE(EQ_NODE(new TargetsSpecialCountAtStartOfTurnNode(), new TargetsMaxSpecialCountNode()),
                // grants Special cooldown count-1.
                new GrantsSpecialCooldownCountMinusOnTargetAtStartOfTurnNode(1),
            )
        ),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit initiates combat or is within 2 spaces of an ally,
        IF_NODE(OR_NODE(DOES_UNIT_INITIATE_COMBAT_NODE, IS_TARGET_WITHIN_2_SPACES_OF_TARGETS_ALLY_NODE),
            // grants Atk/Spd/Def/Res+5 to unit and
            GRANTS_ALL_STATS_PLUS_5_TO_UNIT_DURING_COMBAT_NODE,
            // reduces damage from foe's first attack by 20% of unit's Spd during combat
            new ReducesDamageFromFoesFirstAttackByNPercentDuringCombatIncludingTwiceNode(20),
            // ("first attack" normally means only the first strike; for effects that grant "unit attacks twice," it means the first and second strikes),
        ),
    ));

    AFTER_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // and also,
        IF_NODE(OR_NODE(DOES_UNIT_INITIATE_COMBAT_NODE, IS_TARGET_WITHIN_2_SPACES_OF_TARGETS_ALLY_NODE),
            // if Special triggers before or during combat,
            IF_NODE(IS_UNITS_SPECIAL_TRIGGERED,
                // grants Special cooldown count-1 after combat.
                new GrantsSpecialCooldownCountMinusOnTargetAfterCombatNode(1),
            ),
        ),
    ));
}
{
    let skillId = getSpecialRefinementSkillId(Weapon.InnerWellspring);
    // Enables【Canto (１)】.
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of combat,
        // if unit's HP ≥ 25%,
        IF_NODE(IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE,
            // grants bonus to unit's Atk/Spd/Def/Res = 5 + 10% of unit's Spd at start of combat,
            new GrantsAllStatsPlusNToUnitDuringCombatNode(
                ADD_NODE(5, MULT_TRUNC_NODE(0.1, UNITS_SPD_AT_START_OF_COMBAT_NODE))
            ),
            // unit deals +7 damage (excluding area-of-effect Specials),
            new UnitDealsDamageExcludingAoeSpecialsNode(7),
            // and neutralizes effects that inflict "Special cooldown charge -X" on unit during combat,
            NEUTRALIZES_EFFECTS_THAT_INFLICT_SPECIAL_COOLDOWN_CHARGE_MINUS_X_ON_UNIT,
            // and also,
            // when unit's Special triggers,
            // neutralizes "reduces damage by X%" effects from foe's non-Special skills (excluding area-of-effect Specials).
            WHEN_SPECIAL_TRIGGERS_NEUTRALIZES_FOES_REDUCES_DAMAGE_BY_PERCENTAGE_EFFECTS_FROM_FOES_NON_SPECIAL_EXCLUDING_AOE_SPECIALS_NODE,
        ),
    ));
}

// ゲイルドリヴル
{
    let skillId = getNormalSkillId(Weapon.Geirdriful);
    // Accelerates Special trigger (cooldown count-1).
    // Effective against armored foes.
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit initiates combat or is within 2 spaces of an ally,
        IF_NODE(OR_NODE(DOES_UNIT_INITIATE_COMBAT_NODE, IS_TARGET_WITHIN_2_SPACES_OF_TARGETS_ALLY_NODE),
            new NumThatIsNode(
                // grants Atk/Spd/Def/Res+X to unit during combat
                new GrantsAllStatsPlusNToTargetDuringCombatNode(READ_NUM_NODE),
                // (X = number of【Bonus】and【Penalty】 effects active on unit × 2,
                // + 5; excludes stat bonuses and stat penalties),
                ADD_NODE(MULT_NODE(
                    ADD_NODE(NUM_OF_BONUS_ON_UNIT_EXCLUDING_STAT_NODE,
                        NUM_OF_PENALTY_ON_UNIT_EXCLUDING_STAT_NODE), 2), 5),
            ),
            // reduces damage from foe's first attack during combat by 40%,
            new ReducesDamageFromFoesFirstAttackByNPercentDuringCombatNode(40),
            // and also,
            // if【Bonus】is active on unit,
            IF_NODE(IS_BONUS_ACTIVE_ON_UNIT_NODE,
                // grants Special cooldown charge +1 per attack during combat. (Only highest value applied. Does not stack.)
                GRANTS_SPECIAL_COOLDOWN_CHARGE_PLUS_1_TO_UNIT_PER_ATTACK_DURING_COMBAT_NODE,
            ),
        ),
    ));
}
{
    let skillId = getRefinementSkillId(Weapon.Geirdriful);
    // 重装特効
    // 奥義が発動しやすい（発動カウントー1）
    // 自分から攻撃した時、または、周囲2マス以内に味方がいる時、戦闘中、攻撃、速さ、守備、魔防＋5、さらに、攻撃、速さ、守備、魔防が、自身の【有利な状態】と【不利な状態異常】の数x2だけ増加（強化と弱化は除く）、
    // かつ最初に受けた攻撃と2回攻撃のダメージを40%軽減、かつ自身が【有利な状態】を受けている時、戦闘中、奥義発動カウント変動量+1 （同系統効果複数時、最大値適用）
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        IF_NODE(OR_NODE(DOES_UNIT_INITIATE_COMBAT_NODE, IS_TARGET_WITHIN_2_SPACES_OF_TARGETS_ALLY_NODE),
            GRANTS_ALL_STATS_PLUS_5_TO_UNIT_DURING_COMBAT_NODE,
            new NumThatIsNode(
                // grants Atk/Spd/Def/Res+X to unit during combat
                new GrantsAllStatsPlusNToTargetDuringCombatNode(READ_NUM_NODE),
                // (X = number of【Bonus】and【Penalty】 effects active on unit × 2,
                // + 5; excludes stat bonuses and stat penalties),
                ADD_NODE(MULT_NODE(
                    ADD_NODE(NUM_OF_BONUS_ON_UNIT_EXCLUDING_STAT_NODE,
                        NUM_OF_PENALTY_ON_UNIT_EXCLUDING_STAT_NODE), 2), 5),
            ),
            // reduces damage from foe's first attack during combat by 40%,
            new ReducesDamageFromFoesFirstAttackByNPercentDuringCombatIncludingTwiceNode(40),
            // and also,
            // if【Bonus】is active on unit,
            IF_NODE(IS_BONUS_ACTIVE_ON_UNIT_NODE,
                // grants Special cooldown charge +1 per attack during combat. (Only highest value applied. Does not stack.)
                GRANTS_SPECIAL_COOLDOWN_CHARGE_PLUS_1_TO_UNIT_PER_ATTACK_DURING_COMBAT_NODE,
            ),
        ),
    ));
}
{
    let skillId = getSpecialRefinementSkillId(Weapon.Geirdriful);
    // 移動系補助（体当たり、引き戻し、回り込み等）を使用した時、または自分に使用された時、
    // 自分に「戦闘中、敵の奥義以外のスキルによる「ダメージを〇〇%軽減」を半分無効（無効にする数値は端数切捨て）（範囲奥義を除く）』。 「敵の強化の＋を無効」を付与（1ターン）
    let nodeFunc = () => new SkillEffectNode(
        new GrantsStatusEffectToSkillOwnerNode(
            StatusEffectType.ReducesPercentageOfFoesNonSpecialReduceDamageSkillsBy50Percent,
            StatusEffectType.NeutralizesFoesBonusesDuringCombat,
        ),
    );
    AFTER_MOVEMENT_SKILL_IS_USED_BY_UNIT_HOOKS.addSkill(skillId, nodeFunc);
    AFTER_MOVEMENT_SKILL_IS_USED_BY_ALLY_HOOKS.addSkill(skillId, nodeFunc);
    // 戦闘開始時、自身のHPが25%以上なら、戦闘中、攻撃、速さ、守備、魔防+5、ダメージ＋○x4（最大16、範囲奥義を除く）（○は、自身の【有利な状態】の数（強化は除く））。 戦闘後、7回復
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        IF_NODE(IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE,
            GRANTS_ALL_STATS_PLUS_5_TO_UNIT_DURING_COMBAT_NODE,
            new NumThatIsNode(
                new UnitDealsDamageExcludingAoeSpecialsNode(new EnsureMaxNode(MULT_NODE(READ_NUM_NODE, 4), 16)),
                NUM_OF_BONUS_ON_UNIT_EXCLUDING_STAT_NODE,
            ),
            RESTORES_7_HP_TO_UNIT_AFTER_COMBAT_NODE,
        ),
    ));
}

// 聖日ティルフィング
{
    let weapon = Weapon.HolytideTyrfing;
    let skillIds = [
        getNormalSkillId(weapon),
        getRefinementSkillId(weapon),
    ];
    // Enables【Canto (２)】.
    CAN_TRIGGER_CANTO_HOOKS.addSkills(skillIds, () => TRUE_NODE);
    CALCULATES_DISTANCE_OF_CANTO_HOOKS.addSkills(skillIds, () => new ConstantNumberNode(2));
    // Accelerates Special trigger (cooldown count-1).
    AT_START_OF_COMBAT_HOOKS.addSkills(skillIds, () => new SkillEffectNode(
        // If unit or foe initiates combat after moving to a different space,
        IF_NODE(NOT_NODE(EQ_NODE(NUM_OF_SPACES_START_TO_END_OF_WHOEVER_INITIATED_COMBAT_NODE, 0)),
            // grants Atk/Spd/Def/Res+5 to unit during combat and
            GRANTS_ALL_STATS_PLUS_5_TO_UNIT_DURING_COMBAT_NODE,
            new AppliesSkillEffectsAfterStatusFixedNode(
                new NumThatIsNode(
                    // deals damage = X × 10% of foe's Def
                    new UnitDealsDamageExcludingAoeSpecialsNode(
                        MULT_TRUNC_NODE(READ_NUM_NODE, MULT_TRUNC_NODE(0.1, FOES_EVAL_DEF_DURING_COMBAT_NODE))
                    ),
                    // (X = number of spaces from start position to end position of whoever initiated combat,
                    // max 4; excluding area-of-effect Specials),
                    new EnsureMaxNode(NUM_OF_SPACES_START_TO_END_OF_WHOEVER_INITIATED_COMBAT_NODE, 4),
                ),
            ),
            // and also,
            // if unit's HP ≥ 25% at start of combat,
            IF_NODE(IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE,
                // unit’s HP > 1,
                // and foe would reduce unit’s HP to 0,
                // unit survives with 1 HP.
                // (Once per combat. Does not stack with non-Special effects that allow unit to survive with 1 HP if foe's attack would reduce HP to 0.)
                new TargetCanActivateNonSpecialMiracleNode(0),
            )
        ),
    ));

    let skillId = getSpecialRefinementSkillId(weapon);
    // "At start of combat,
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // if unit's HP ≥ 25%,
        IF_NODE(IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE,
            // grants bonus to unit's Atk/Spd/Def/Res = 5 + number of foes within 3 rows or 3 columns centered on unit × 2 (max 11),
            new GrantsAllStatsPlusNToUnitDuringCombatNode(
                new EnsureMaxNode(
                    ADD_NODE(5, MULT_NODE(NUM_OF_FOES_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_UNIT_NODE, 2)),
                    11,
                ),
            ),
            // reduces the percentage of foe's non-Special "reduce damage by X%" skills by 50% (excluding area-of-effect Specials),
            REDUCES_PERCENTAGE_OF_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE,
            new NumThatIsNode(
                new SkillEffectNode(
                    // and reduces damage from foe's first attack by X during combat
                    // ("first attack" normally means only the first strike; for effects that grant "unit attacks twice," it means the first and second strikes),
                    new ReducesDamageFromFoesFirstAttackByNPercentDuringCombatIncludingTwiceNode(READ_NUM_NODE),
                    // and reduces damage by X when foe's attack triggers foe Special
                    new ReducesDamageWhenFoesSpecialExcludingAoeSpecialNode(READ_NUM_NODE),
                ),
                // (X = number of spaces from start position to end position of whoever initiated combat × 3; max 12; excluding area-of-effect Specials),
                new EnsureMaxNode(MULT_NODE(NUM_OF_SPACES_START_TO_END_OF_WHOEVER_INITIATED_COMBAT_NODE, 3), 12),
            ),
            // and restores 7 HP to unit after combat.".
            RESTORES_7_HP_TO_UNIT_AFTER_COMBAT_NODE
        ),
    ));
}

// 師の授けの書
{
    let skillId = getNormalSkillId(Weapon.ProfessorialGuide);
    // Accelerates Special trigger (cooldown count-1).
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit initiates combat or is within 2 spaces of an ally,
        IF_NODE(OR_NODE(DOES_UNIT_INITIATE_COMBAT_NODE, IS_TARGET_WITHIN_2_SPACES_OF_TARGETS_ALLY_NODE),
            // grants Atk/Spd/Def/Res+5 to unit and
            GRANTS_ALL_STATS_PLUS_5_TO_UNIT_DURING_COMBAT_NODE,
            // neutralizes effects that
            // grant "Special cooldown charge +X" to foe or
            NEUTRALIZES_EFFECTS_THAT_GRANT_SPECIAL_COOLDOWN_CHARGE_PLUS_X_TO_FOE,
            // inflict "Special cooldown charge -X" on unit during combat.
            NEUTRALIZES_EFFECTS_THAT_INFLICT_SPECIAL_COOLDOWN_CHARGE_MINUS_X_ON_UNIT,
        ),
    ));
    FOR_ALLIES_GRANTS_EFFECTS_TO_ALLIES_DURING_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // Allies within 2 spaces gain:
        IF_NODE(IS_TARGET_WITHIN_2_SPACES_OF_SKILL_OWNER_NODE,
            // "Neutralizes effects that
            // grant 'Special cooldown charge +X' to foe or
            // inflict "Special cooldown charge -X" on unit during combat.
            NEUTRALIZES_EFFECTS_THAT_GRANT_SPECIAL_COOLDOWN_CHARGE_PLUS_X_TO_FOE,
            // inflict 'Special cooldown charge -X' on unit during combat."
            NEUTRALIZES_EFFECTS_THAT_INFLICT_SPECIAL_COOLDOWN_CHARGE_MINUS_X_ON_UNIT,
        ),
    ));
}
{
    let skillId = getRefinementSkillId(Weapon.ProfessorialGuide);
    // "Accelerates Special trigger (cooldown count-1).
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit initiates combat or if there is an ally within 3 rows or 3 columns centered on unit,
        IF_NODE(OR_NODE(DOES_UNIT_INITIATE_COMBAT_NODE, IS_THERE_ALLY_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_UNIT_NODE),
            // grants Atk/Spd/Def/Res+5 to unit,
            GRANTS_ALL_STATS_PLUS_5_TO_UNIT_DURING_COMBAT_NODE,
            // reduces damage from foe's first attack by 30% (for standard attacks,
            // "first attack" means only the first strike; for effects that grant "unit attacks twice," it means the first and second strikes),
            new ReducesDamageFromFoesFirstAttackByNPercentDuringCombatIncludingTwiceNode(30),
            // and neutralizes effects that grant "Special cooldown charge +X" to foe or inflict "Special cooldown charge -X" on unit during combat.
            NEUTRALIZES_EFFECTS_THAT_GRANT_SPECIAL_COOLDOWN_CHARGE_PLUS_X_TO_FOE,
            NEUTRALIZES_EFFECTS_THAT_INFLICT_SPECIAL_COOLDOWN_CHARGE_MINUS_X_ON_UNIT,
        )
    ));

    FOR_ALLIES_GRANTS_STATS_PLUS_TO_ALLIES_DURING_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // For allies within 3 rows or 3 columns centered on unit,
        IF_NODE(IS_TARGET_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_SKILL_OWNER_NODE,
            // grants Atk/Spd/Def/Res+4 and
            GRANTS_ALL_STATS_PLUS_4_TO_TARGET_DURING_COMBAT_NODE,
        ),
    ));

    FOR_ALLIES_GRANTS_EFFECTS_TO_ALLIES_DURING_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        IF_NODE(IS_TARGET_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_SKILL_OWNER_NODE,
            // neutralizes effects that grant "Special cooldown charge +X" to foe or inflict "Special cooldown charge -X" on ally during their combat.".
            NEUTRALIZES_EFFECTS_THAT_GRANT_SPECIAL_COOLDOWN_CHARGE_PLUS_X_TO_FOE,
            NEUTRALIZES_EFFECTS_THAT_INFLICT_SPECIAL_COOLDOWN_CHARGE_MINUS_X_ON_UNIT,
        ),
    ))
}
{
    let skillId = getSpecialRefinementSkillId(Weapon.ProfessorialGuide);
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // "At start of combat,
        // if unit's HP ≥ 25%,
        // grants bonus to unit's Atk/Spd/Def/Res = number of allies within 3 rows or 3 columns centered on unit × 2,
        // + 5 (max 11) and deals damage = 20% of unit's Spd during combat (excluding area-of-effect Specials),
        // and also,
        // when unit's Special triggers,
        // neutralizes "reduces damage by X%" effects from foe's non-Special skills (excluding area-of-effect Specials).".
    ));
}

// 魔銃ブロック
{
    let skillId = getNormalSkillId(Weapon.GrimBrokkr);
    // Grants Atk+3.
    // Enables【Canto (２)】during turns 1 through 4.
    CAN_TRIGGER_CANTO_HOOKS.addSkill(skillId, () => LTE_NODE(CURRENT_TURN_NODE, 4));
    CALCULATES_DISTANCE_OF_CANTO_HOOKS.addSkill(skillId, () => new ConstantNumberNode(2));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit initiates combat or is not adjacent to an ally,
        IF_NODE(OR_NODE(DOES_UNIT_INITIATE_COMBAT_NODE, LTE_NODE(new NumOfTargetsAlliesWithinNSpacesNode(1), 0)),
            // inflicts Atk/Res-6 on foe during combat and
            new InflictsStatsMinusOnFoeDuringCombatNode(6, 0, 0, 6),
            // unit makes a guaranteed follow-up attack.
            UNIT_MAKES_GUARANTEED_FOLLOW_UP_ATTACK_NODE,
        ),
    ));
}
{
    let skillId = getRefinementSkillId(Weapon.GrimBrokkr);
    // Grim Brokkr can be upgraded in the Weapon Refinery.
    // When upgraded, the description of Grim Brokkr becomes "Grants Atk+3.
    // Enables Canto (2) during turns 1 through 4.
    CAN_TRIGGER_CANTO_HOOKS.addSkill(skillId, () => LTE_NODE(CURRENT_TURN_NODE, 4));
    CALCULATES_DISTANCE_OF_CANTO_HOOKS.addSkill(skillId, () => new ConstantNumberNode(2));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit initiates combat or if the number of allies adjacent to unit ≤ 1,
        IF_NODE(OR_NODE(DOES_UNIT_INITIATE_COMBAT_NODE, LTE_NODE(NUMBER_OF_TARGET_ALLIES_ADJACENT_TO_TARGET, 1)),
            // inflicts Atk/Res-6 and Spd-5 on foe,
            new InflictsStatsMinusOnFoeDuringCombatNode(6, 5, 0, 6),
            // unit makes a guaranteed follow-up attack,
            UNIT_MAKES_GUARANTEED_FOLLOW_UP_ATTACK_NODE,
            // and deals damage = 15% of unit's Atk during combat (excluding area-of-effect Specials),
            new AppliesSkillEffectsAfterStatusFixedNode(
                new UnitDealsDamageExcludingAoeSpecialsNode(MULT_TRUNC_NODE(0.15, UNITS_ATK_DURING_COMBAT_NODE)),
            ),
            // and restores 7 HP to unit after combat.".
            RESTORES_7_HP_TO_UNIT_AFTER_COMBAT_NODE,
        ),
    ));
}
{
    let skillId = getSpecialRefinementSkillId(Weapon.GrimBrokkr);
    // Grim Brokkr can be upgraded with the additional effect Grim Brokkr W
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // "At start of turn,
        // if unit's HP ≥ 25%,
        IF_NODE(IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_TURN_NODE,
            // inflicts Atk/Res-7,【Sabotage】,and【Schism】
            // on closest foes and any foes within 2 spaces of those foes through their next actions.
            new ForEachTargetsClosestFoeAndAnyFoeWithin2SpacesOfThoseFoesNode(TRUE_NODE,
                new InflictsStatsMinusAtStartOfTurnNode(7, 0, 0, 7),
                new InflictsStatusEffectsAtStartOfTurnNode(StatusEffectType.Sabotage, StatusEffectType.Schism),
            ),
        ),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of combat,
        // if unit's HP ≥ 25%,
        IF_NODE(IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE,
            new NumThatIsNode(
                // inflicts penalty on foe's Atk/Spd/Res during combat = 5 + number of foes within 3 spaces of target (including target),
                new InflictsStatsMinusOnFoeDuringCombatNode(READ_NUM_NODE, READ_NUM_NODE, 0, READ_NUM_NODE),
                ADD_NODE(5, new NumOfTargetsFoesWithinNSpacesOfTargetNode(3)),
            ),
            // reduces damage from foe's attacks by X during combat,
            new NumThatIsNode(
                // and also,
                // when foe's attack triggers foe's Special,
                // reduces damage by X
                new ReducesDamageWhenFoesSpecialExcludingAoeSpecialNode(READ_NUM_NODE),
                // (X = 3 × the total of the number of Bonus effects active on unit and the number of Penalty effects active on foe,
                // excluding stat bonuses and stat penalties; max 12; excluding area-of-effect Specials).
                new EnsureMaxNode(
                    MULT_NODE(3, NUM_OF_BONUS_ON_UNIT_PLUS_NUM_OF_PENALTY_ON_FOE_EXCLUDING_STAT_NODE),
                    12,
                ),
            ),
        ),
    ));
}

// 鼓動の暗煙
{
    let skillId = PassiveC.PulseSmog;
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // Inflicts Spd/Def-3 on foe and
        new InflictsStatsMinusOnFoeDuringCombatNode(0, 3, 3, 0),
        // inflicts Special cooldown charge -1 on foe per attack during combat (only highest value applied; does not stack).
        INFLICTS_SPECIAL_COOLDOWN_CHARGE_MINUS_1_ON_FOE_NODE,
        // If unit initiates combat and foe's attack can trigger foe's Special,
        IF_NODE(AND_NODE(DOES_UNIT_INITIATE_COMBAT_NODE, CAN_FOES_ATTACK_TRIGGER_FOES_SPECIAL_NODE),
            // inflicts Special cooldown count+1 on foe before foe's first attack during combat
            INFLICTS_SPECIAL_COOLDOWN_COUNT_PLUS_N_ON_TARGETS_FOE_BEFORE_TARGETS_FOES_FIRST_ATTACK_NODE(1),
            // (cannot exceed foe's maximum Special cooldown).
        ),
    ));

    AFTER_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // After combat,
        // on target and foes within 3 spaces of target through their next actions and
        new ForEachTargetAndFoeWithinNSpacesOfTargetNode(3, TRUE_NODE,
            // inflicts Atk-7 and
            new InflictsStatsMinusAfterCombatNode(7, 0, 0, 0),
            // 【Guard】
            new InflictsStatusEffectsAfterCombatNode(StatusEffectType.Guard),
            // inflicts Special cooldown count+1 on those foes
            new InflictsSpecialCooldownCountPlusNOnTargetAfterCombat(1),
            // (cannot exceed the foe's maximum Special cooldown).
        ),
    ));
}

// 無間の瞬動
{
    let skillId = PassiveB.ShadowSlide;
    UNIT_CAN_MOVE_TO_A_SPACE_HOOKS.addSkill(skillId, () => UNITE_SPACES_NODE(
        // Unit can move to a space within 2 spaces of any ally that has entered combat during the current turn.
        new ForEachAllyForSpacesNode(new HasTargetEnteredCombatDuringTheCurrentTurnNode,
            new SkillOwnerPlacableSpacesWithinNSpacesFromSpaceNode(2, TARGETS_PLACED_SPACE_NODE),
        ),
        // Unit can move to a space within 2 spaces of any ally within 2 spaces.
        new ForEachAllyForSpacesNode(IS_TARGET_WITHIN_2_SPACES_OF_SKILL_OWNER_NODE,
            new SkillOwnerPlacableSpacesWithinNSpacesFromSpaceNode(2, TARGETS_PLACED_SPACE_NODE),
        ),
    ));

    UNIT_CAN_MOVE_THROUGH_FOES_SPACES_HOOKS.addSkill(skillId, () => OR_NODE(
        // If ally has entered combat during the current turn,
        // unit can move through foes' spaces.
        new IsThereUnitOnMapNode(AND_NODE(
            ARE_TARGET_AND_SKILL_OWNER_ALLIES_NODE,
            HAS_TARGET_ENTERED_COMBAT_DURING_CURRENT_TURN_NODE)
        ),
    ));

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit is within 3 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_TARGETS_ALLY_NODE,
            // inflicts Atk/Spd/Def-5 on foe,
            new InflictsStatsMinusOnFoeDuringCombatNode(5, 5, 5, 0),
            // deals damage = 20% of unit's Spd (excluding area-of-effect Specials),
            new GrantsOrInflictsStatsAfterStatusFixedNode(
                new UnitDealsDamageExcludingAoeSpecialsNode(MULT_TRUNC_NODE(0.2, UNITS_SPD_DURING_COMBAT_NODE)),
            ),
            // reduces the percentage of foe's non-Special "reduce damage by X%" skills by 50% (excluding area-of-effect Specials),
            REDUCES_PERCENTAGE_OF_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE,
            // and reduces damage from foe's first attack by 7 during combat
            new ReducesDamageFromFoesFirstAttackByNDuringCombatIncludingTwiceNode(7),
            // ("first attack" normally means only the first strike; for effects that grant "unit attacks twice," it means the first and second strikes).
        ),
    ));
}

// 修羅の双刃
{
    let skillId = Weapon.DualSword;
    // Accelerates Special trigger (cooldown count-1).
    // Unit attacks twice (even if foe initiates combat, unit attacks twice).
    // Effect:【Dagger ７】
    FOR_FOES_INFLICTS_STATS_MINUS_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // Inflicts penalty on Atk/Spd/Def/Res
        // for foes within 3 rows or 3 columns centered on unit during combat
        IF_NODE(IS_TARGET_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_SKILL_OWNER_NODE,
            new NumThatIsNode(
                new InflictsStatsMinusOnTargetDuringCombatNode(READ_NUM_NODE, READ_NUM_NODE, READ_NUM_NODE, READ_NUM_NODE),
                // = 4 + number of combat instances on current turn × 4
                // (max 12; includes combat instances unit does not participate in; battles on player phase and on enemy phase are counted separately; does not include this current combat instance).
                new EnsureMaxNode(ADD_NODE(4, MULT_NODE(NUM_OF_COMBAT_ON_CURRENT_TURN_NODE, 4)), 12),
            ),
        ),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of combat,
        // if unit's HP ≥ 25%,
        IF_NODE(IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE,
            // grants bonus to unit's Atk/Spd/Def/Res = 5 + number of foes within 3 rows or 3 columns centered on unit × 3 (max 14),
            new NumThatIsNode(
                new GrantsAllStatsPlusNToUnitDuringCombatNode(READ_NUM_NODE),
                new EnsureMaxNode(ADD_NODE(5, MULT_NODE(NUM_OF_FOES_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_UNIT_NODE, 3)), 14),
            ),
            // reduces damage from foe's first attack by 30% ("first attack" normally means only the first strike; for effects that grant "unit attacks twice," it means the first and second strikes),
            new ReducesDamageFromFoesFirstAttackByNPercentDuringCombatIncludingTwiceNode(30),
            // and neutralizes effects that grant "Special cooldown charge +X" to foe or inflict "Special cooldown charge -X" on unit during combat.
            NEUTRALIZES_EFFECTS_THAT_GRANT_SPECIAL_COOLDOWN_CHARGE_PLUS_X_TO_FOE,
            NEUTRALIZES_EFFECTS_THAT_INFLICT_SPECIAL_COOLDOWN_CHARGE_MINUS_X_ON_UNIT,
        ),
    ));
}

// 絶対化身
{
    let skillId = PassiveS.Beast;
    // Removes the condition to transform
    CAN_TRANSFORM_AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new TraceBoolNode(TRUE_NODE));
}

// 重歩傭兵の槍
{
    let skillId = getSpecialRefinementSkillId(Weapon.MercenaryLance);
    // Mercenary Lance can be upgraded with the additional effect Mercenary Lance W
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode());
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // "At start of combat, if unit's HP ≥ 25%,
        IF_NODE(IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE,
            new AppliesSkillEffectsAfterStatusFixedNode(
                new NumThatIsNode(
                    // inflicts Atk/Def-X on foe during combat (X = 5 + 15% of unit's Def) and
                    new InflictsStatsMinusOnFoeDuringCombatNode(READ_NUM_NODE, 0, READ_NUM_NODE, 0),
                    ADD_NODE(5, MULT_TRUNC_NODE(0.15, UNITS_DEF_DURING_COMBAT_NODE)),
                ),
            ),
            // restores 10 HP to unit after combat, and also,
            new RestoresHpToUnitAfterCombatNode(10),
            // if foe initiates combat,
            IF_NODE(DOES_FOE_INITIATE_COMBAT_NODE,
                // grants Special cooldown count-2 to unit before foe's first attack during combat.
                new GrantsSpecialCooldownCountMinusNToUnitBeforeFoesFirstAttackDuringCombatNode(2),
            ),
        ),
    ));
}

{
    let skillId = getNormalSkillId(Weapon.MercenaryLance);
    let refinedId = getRefinementSkillId(Weapon.MercenaryLance);
    let nodeFunc = () => new SkillEffectNode(
        // If foe initiates combat or foe's HP ≥ 75% at start of combat,
        IF_NODE(OR_NODE(DOES_UNIT_INITIATE_COMBAT_NODE, IS_FOES_HP_GTE_75_PERCENT_AT_START_OF_COMBAT_NODE),
            // inflicts Atk/Def-5 on foe,
            new InflictsStatsMinusOnFoeDuringCombatNode(5, 0, 5, 0),
            // neutralizes penalties on unit,
            NEUTRALIZES_PENALTIES_ON_UNIT_NODE,
            // reduces damage from foe's attacks by 20% of unit's Def (excluding area-of-effect Specials), and
            new AppliesSkillEffectsAfterStatusFixedNode(
                new ReducesDamageExcludingAoeSpecialsNode(MULT_TRUNC_NODE(0.2, UNITS_DEF_DURING_COMBAT_NODE)),
            ),
            // grants Special cooldown charge +1 to unit per attack during combat (only highest value applied; does not stack).
            GRANTS_SPECIAL_COOLDOWN_CHARGE_PLUS_1_TO_UNIT_PER_ATTACK_DURING_COMBAT_NODE,
        ),
    );
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, nodeFunc);
    AT_START_OF_COMBAT_HOOKS.addSkill(refinedId, nodeFunc);
}

// 開闢の鼓動
{
    let skillId = PassiveC.CreationPulse;
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If【Penalty】is active on foe,
        IF_NODE(IS_PENALTY_ACTIVE_ON_FOE_NODE,
            // grants Atk/Spd+3 to unit during combat, and also,
            new GrantsStatsPlusToUnitDuringCombatNode(3, 3, 0, 0),
            // if unit's attack can trigger unit's Special,
            IF_NODE(CAN_UNITS_ATTACK_TRIGGER_SPECIAL_NODE,
                // grants Special cooldown count-X to unit before unit's first attack during combat
                new GrantsSpecialCooldownCountMinusNToTargetBeforeTargetsFirstAttackDuringCombatNode(
                    // (X = number of 【Penalty】effects active on foe, excluding stat penalties; max 2).
                    new EnsureMaxNode(NUM_OF_PENALTY_ON_FOE_EXCLUDING_STAT_NODE, 2),
                ),
            )
        )
    ));
}

// 読み通りです!
{
    let skillId = PassiveB.AccordingToPlan;
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of turn,
        // if unit's HP ≥ 25%,
        IF_NODE(IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_TURN_NODE,
            // to unit and allies within 2 spaces of unit for 1 turn and
            new ForEachTargetAndTargetsAllyWithin2SpacesOfTargetNode(TRUE_NODE,
                // grants Atk/Spd+6 and
                new GrantsStatsPlusAtStartOfTurnNode(6, 6, 0, 0),
                // 【Canto (１)】
                new GrantsStatusEffectsAtStartOfTurnNode(StatusEffectType.Canto1),
            ),
            // on closest foes and any foe within 2 spaces of those foes through their next actions.
            FOR_EACH_TARGETS_CLOSEST_FOE_AND_ANY_FOE_WITHIN_2_SPACES_OF_THOSE_FOES_NODE(
                // inflicts【Hush Spectrum】and【Panic】
                new InflictsStatusEffectsAtStartOfTurnNode(StatusEffectType.HushSpectrum, StatusEffectType.Panic),
            ),
        )
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of combat, if unit's HP ≥ 25%,
        IF_NODE(IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE,
            new InflictsStatsMinusOnFoeDuringCombatNode(5, 5, 0, 5),
            new NumThatIsNode(
                new SkillEffectNode(
                    // unit deals +X × 5 damage (max 25; excluding area-of-effect Specials), and
                    new UnitDealsDamageExcludingAoeSpecialsNode(
                        new EnsureMaxNode(MULT_NODE(READ_NUM_NODE, 5), 25)
                    ),
                    // reduces damage from foe's first attack by X × 3 (max 15) during combat
                    new ReducesDamageFromFoesFirstAttackByNDuringCombatIncludingTwiceNode(
                        new EnsureMaxNode(MULT_NODE(READ_NUM_NODE, 3), 15)
                    ),
                ),
                // (X = number of Bonus effects active on unit,
                // excluding stat bonuses + number of Penalty effects active on foe, excluding stat penalties;
                NUM_OF_BONUS_ON_UNIT_PLUS_NUM_OF_PENALTY_ON_FOE_EXCLUDING_STAT_NODE,
                // "first attack" normally means only the first strike;
                // for effects that grant "unit attacks twice," it means the first and second strikes).
            ),
        )
    ));
}

// 聖王の参謀の術書
{
    let skillId = Weapon.ExaltsTactics;
    // Accelerates Special trigger (cooldown count-1).

    let nodeFuncForAssist = () => new SkillEffectNode(
        // if there is no【Divine Vein (Ice)】 currently applied by unit or allies,
        IF_NODE(IS_THERE_NO_DIVINE_VEIN_ICE_CURRENTLY_APPLIED_BY_TARGET_OR_TARGETS_ALLIES_NODE,
            // applies 【Divine Vein (Ice)】to spaces 2 spaces away from target after movement for 1 turn
            new AppliesDivineVeinNode(
                DivineVeinType.Ice,
                AND_NODE(
                    new IsSpacesNSpacesAwayFromAssistedNode(2),
                    // (excludes spaces occupied by a foe,
                    IS_SPACE_OCCUPIED_BY_TARGETS_FOE_NODE,
                    // destructible terrain other than【Divine Vein (Ice)】, and
                    IS_NOT_DESTRUCTIBLE_TERRAIN_OTHER_THAN_DIVINE_VEIN_ICE_NODE,
                    // TODO: ワープができるコンテンツが来たら実装する
                    // warp spaces in Rival Domains).
                ),
            ),
        )
    );

    let nodeFunc = () => new SkillEffectNode(
        // if there is no【Divine Vein (Ice)】 currently applied by unit or allies,
        IF_NODE(IS_THERE_NO_DIVINE_VEIN_ICE_CURRENTLY_APPLIED_BY_TARGET_OR_TARGETS_ALLIES_NODE,
            // applies 【Divine Vein (Ice)】to spaces 2 spaces away from target after movement for 1 turn
            new AppliesDivineVeinNode(
                DivineVeinType.Ice,
                AND_NODE(
                    new IsSpacesNSpacesAwayFromTargetNode(2),
                    // (excludes spaces occupied by a foe,
                    IS_SPACE_OCCUPIED_BY_TARGETS_FOE_NODE,
                    // destructible terrain other than【Divine Vein (Ice)】, and
                    IS_NOT_DESTRUCTIBLE_TERRAIN_OTHER_THAN_DIVINE_VEIN_ICE_NODE,
                    // TODO: ワープができるコンテンツが来たら実装する
                    // warp spaces in Rival Domains).
                ),
            ),
        )
    );

    // If a Rally or movement Assist skill (like Reposition, Shove, Pivot, etc.) is used by unit and
    AFTER_RALLY_SKILL_IS_USED_BY_UNIT_HOOKS.addSkill(skillId, nodeFuncForAssist);
    AFTER_MOVEMENT_SKILL_IS_USED_BY_UNIT_HOOKS.addSkill(skillId, nodeFuncForAssist);

    // After unit acts (if Canto triggers, after Canto),
    // or at start of enemy phase when defending in Aether Raids,
    // if there is no【Divine Vein (Ice)】 currently applied by unit or allies,
    // applies 【Divine Vein (Ice)】to spaces 2 spaces away from unit for 1 turn
    // (excludes spaces occupied by a foe, destructible terrain, and warp spaces in Rival Domains).
    AFTER_UNIT_ACTS_IF_CANTO_TRIGGERS_AFTER_CANTO_HOOKS.addSkill(skillId, nodeFunc);
    AT_START_OF_ENEMY_PHASE_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        IF_NODE(WHEN_DEFENDING_IN_AETHER_RAIDS_NODE,
            nodeFunc(),
        )
    ));

    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode());
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of combat,
        // if unit's HP ≥ 25%,
        IF_NODE(IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE,
            new NumThatIsNode(
                new SkillEffectNode(
                    // inflicts penalty on foe's Atk/Spd/Res =
                    new InflictsStatsMinusOnFoeDuringCombatNode(READ_NUM_NODE, READ_NUM_NODE, 0, READ_NUM_NODE),
                ),
                // 5 + number of allies within 3 rows or 3 columns centered on unit × 3 (max 14),
                new EnsureMaxNode(
                    ADD_NODE(5, MULT_NODE(NUM_OF_ALLIES_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_UNIT_NODE, 3)),
                    14
                ),
            ),
            // neutralizes penalties on unit, and
            NEUTRALIZES_PENALTIES_ON_UNIT_NODE,
            // neutralizes effects that inflict "Special cooldown charge -X" on unit during combat, and also,
            NEUTRALIZES_SPECIAL_COOLDOWN_CHARGE_MINUS_NODE,
            // when Special triggers, neutralizes foe's "reduces damage by X%" effects from foe's non-Special skills (excluding area-of-effect Specials).
            WHEN_SPECIAL_TRIGGERS_NEUTRALIZES_FOES_REDUCES_DAMAGE_BY_PERCENTAGE_EFFECTS_FROM_FOES_NON_SPECIAL_EXCLUDING_AOE_SPECIALS_NODE,
        )
    ));

    HAS_DIVINE_VEIN_SKILLS_WHEN_ACTION_DONE_HOOKS.addSkill(skillId, () => TRUE_NODE);
}

// 被害妄想
{
    let skillId = PassiveC.Paranoia;
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of turn,
        // grants【Null Follow-Up】 to unit and
        new GrantsStatusEffectsAtStartOfTurnNode(StatusEffectType.NullFollowUp),
        // grants【Paranoia】to unit and allies within 2 spaces of unit for 1 turn, and
        new ForEachTargetAndTargetsAllyWithin2SpacesOfTargetNode(TRUE_NODE,
            new GrantsStatusEffectsAtStartOfTurnNode(StatusEffectType.Paranoia),
            // deals 1 damage to unit and those allies.
            new DealsDamageToTargetAtStartOfTurnNode(1),
        ),
        // At start of turn, if unit is within 5 spaces of a foe,
        IF_NODE(new IfTargetIsWithinNSpacesOfFoe(5),
            // inflicts【Penalty】effects active on unit on closest foes and any foe within 2 spaces of those foes,
            // and neutralizes any【Penalty】 effects active on unit (excluding penalties inflicted at the start of the same turn).
            FOR_EACH_TARGETS_CLOSEST_FOE_AND_ANY_FOE_WITHIN_2_SPACES_OF_THOSE_FOES_NODE(
                new InflictsPenaltyEffectsActiveOnSkillOwner(),
            ),
        )
    ));

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of combat, if unit's HP ≤ 99%, grants Atk/Spd+5 to unit and neutralizes effects that inflict "Special cooldown charge -X" on unit during combat.
        IF_NODE(IS_UNITS_HP_LTE_99_PERCENT_IN_COMBAT_NODE,
            new GrantsStatsPlusToUnitDuringCombatNode(5, 5, 0, 0),
            NEUTRALIZES_SPECIAL_COOLDOWN_CHARGE_MINUS_NODE,
        )
    ));
}

// 曲射
{
    let skillId = Special.CurvedShot;
    // 通常攻撃奥義(範囲奥義・疾風迅雷などは除く)
    NORMAL_ATTACK_SPECIAL_SET.add(skillId);

    // 奥義カウント設定(ダメージ計算機で使用。奥義カウント2-4の奥義を設定)
    COUNT2_SPECIALS.push(skillId);
    INHERITABLE_COUNT2_SPECIALS.push(skillId);

    // Boosts Special damage by 30% of the greater of foe's Spd or Def.
    WHEN_APPLIES_SPECIAL_EFFECTS_AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        new BoostsDamageWhenSpecialTriggersNode(
            MAX_NODE(
                MULT_TRUNC_NODE(0.3, UNITS_SPD_DURING_COMBAT_NODE),
                MULT_TRUNC_NODE(0.3, UNITS_DEF_DURING_COMBAT_NODE),
            ),
        ),
    ));

    AT_APPLYING_ONCE_PER_COMBAT_DAMAGE_REDUCTION_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit's or foe's Special is ready or unit's or foe's Special triggered before or during this combat
        // and if unit can attack during combat,
        // reduces damage from foe's next attack by 40% (once per combat; excluding area-of-effect Specials).
        IF_NODE(AND_NODE(
                IS_THE_UNITS_OR_FOES_SPECIAL_READY_OR_WAS_THE_UNITS_OR_FOES_SPECIAL_TRIGGERED_BEFORE_OR_DURING_THIS_COMBAT,
                TARGET_CAN_ATTACK_DURING_COMBAT_NODE,
            ),
            new ReducesDamageFromTargetsFoesNextAttackByNPercentOncePerCombatNode(40),
        )
    ));
}

// 尽きざるもの
{
    let skillId = Weapon.TheInexhaustible;
    // Enables【Canto (Dist.; Max ３)】.
    CAN_TRIGGER_CANTO_HOOKS.addSkill(skillId, () => TRUE_NODE);
    CALCULATES_DISTANCE_OF_CANTO_HOOKS.addSkill(skillId, () => CANTO_DIST_MAX_3_NODE);
    // Accelerates Special trigger (cooldown count-1).
    // Effective against flying foes.

    // TODO: 攻撃回数設定時のHOOKSを作成するか検討する
    AFTER_FOLLOW_UP_CONFIGURED_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // Unit attacks twice (even if foe initiates combat, unit attacks twice).
        TARGET_ATTACKS_TWICE_WHEN_TARGET_INITIATES_COMBAT_NODE,
        TARGET_ATTACKS_TWICE_WHEN_TARGETS_FOE_INITIATES_COMBAT_NODE,
    ));

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit initiates combat or【Bonus】is active on unit,
        IF_NODE(OR_NODE(DOES_UNIT_INITIATE_COMBAT_NODE, IS_BONUS_ACTIVE_ON_UNIT_NODE),
            // grants Atk/Spd/Def/Res+5 to unit,
            GRANTS_ALL_STATS_PLUS_5_TO_UNIT_DURING_COMBAT_NODE,
            // grants bonus to unit's Atk/Spd/Def/Res = 15% of unit's Spd at start of combat,
            new GrantsAllStatsPlusNToUnitDuringCombatNode(MULT_TRUNC_NODE(0.15, UNITS_SPD_AT_START_OF_COMBAT_NODE)),
            new AppliesSkillEffectsAfterStatusFixedNode(
                // deals damage = 20% of unit's Spd (excluding area-of-effect Specials), and
                new UnitDealsDamageExcludingAoeSpecialsNode(MULT_TRUNC_NODE(0.2, UNITS_SPD_DURING_COMBAT_NODE)),
            ),
            // reduces the percentage of foe's non-Special "reduce damage by X%" skills by 50% during combat (excluding area-of-effect Specials).
            REDUCES_PERCENTAGE_OF_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE,
        ),
    ));
}

// 迅雷風烈・無極
{
    let skillId = PassiveC.EndlessTempest;
    // At start of turn, unit can move 1 extra space (that turn only; does not stack).
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        new GrantsStatusEffectsAtStartOfTurnNode(StatusEffectType.MobilityIncreased),
    ));

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit or foe initiates combat after moving to a different space,
        IF_NODE(IF_UNIT_OR_FOE_INITIATES_COMBAT_AFTER_MOVING_TO_A_DIFFERENT_SPACE_NODE,
            // grants bonus to unit's Atk/Spd/Def/Res = number of spaces from start position to end position of whoever initiated combat (max 3) and
            new GrantsAllStatsPlusNToUnitDuringCombatNode(
                new EnsureMaxNode(NUMBER_OF_SPACES_FROM_START_POSITION_TO_END_POSITION_OF_WHOEVER_INITIATED_COMBAT,
                    3)
            ),
            // neutralizes foe's bonuses (from skills like Fortify, Rally, etc.) during combat.
            NEUTRALIZES_FOES_BONUSES_TO_STATS_DURING_COMBAT_NODE,
        )
    ));
}

// 一匹狼
{
    let skillId = PassiveB.LoneWolf;
    // If a skill compares unit's Spd to a foe's or ally's Spd, treats unit's Spd as if granted +7.
    AT_COMPARING_STATS_HOOKS.addSkill(skillId, () => STATS_NODE(0, 7, 0, 0));

    // If unit has not used or been the target of an Assist skill during the current turn,
    // grants another action to unit and
    // inflicts【Isolation】 on unit and Pair Up cohort
    // through their next action
    // in the following cases:
    // A) unit initiated combat, or
    // B) unit took action without entering combat
    // (takes priority over Canto; once per turn, with A and B counted separately).
    AFTER_COMBAT_FOR_ANOTHER_ACTION_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        IF_NODE(AND_NODE(
                IF_TARGET_HAS_NOT_USED_ASSIST_DURING_CURRENT_TURN_NODE,
                IF_TARGET_HAS_NOT_BEEN_TARGET_OF_ASSIST_DURING_CURRENT_TURN_NODE),
            GRANTS_ANOTHER_ACTION_AND_INFLICTS_ISOLATION_AFTER_TARGET_INITIATED_COMBAT_NODE,
        )
    ));
    AFTER_ACTION_WITHOUT_COMBAT_FOR_ANOTHER_ACTION_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        IF_NODE(AND_NODE(
                IF_TARGET_HAS_NOT_USED_ASSIST_DURING_CURRENT_TURN_NODE,
                IF_TARGET_HAS_NOT_BEEN_TARGET_OF_ASSIST_DURING_CURRENT_TURN_NODE),
            GRANTS_ANOTHER_ACTION_AND_INFLICTS_ISOLATION_AFTER_ACTION_WITHOUT_COMBAT_NODE,
        )
    ));

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of combat, if unit's HP ≥ 25% or if number of allies adjacent to unit ≤ 1,
        IF_NODE(OR_NODE(
                IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE,
                new LteNode(NUMBER_OF_TARGET_ALLIES_ADJACENT_TO_TARGET, 1)
            ),
            // inflicts Atk/Spd/Def/Res-5 on foe,
            INFLICTS_ALL_STATS_MINUS_5_ON_FOE_DURING_COMBAT_NODE,
            new AppliesSkillEffectsAfterStatusFixedNode(
                // deals damage = 20% of unit's Spd (including when dealing damage with a Special triggered before combat), and
                new UnitDealsDamageExcludingAoeSpecialsNode(MULT_TRUNC_NODE(0.2, UNITS_SPD_DURING_COMBAT_NODE)),
                // reduces damage from foe's attacks by 20% of unit's Spd during combat (including when taking damage from a Special triggered before combat), and also,
                new ReducesDamageExcludingAoeSpecialsNode(MULT_TRUNC_NODE(0.2, UNITS_SPD_DURING_COMBAT_NODE)),
                // when foe's attack triggers foe's Special,
                // reduces damage by 20% of unit's Spd (including when taking damage from a Special triggered before combat).
                new ReducesDamageWhenFoesSpecialExcludingAoeSpecialNode(MULT_TRUNC_NODE(0.2, UNITS_SPD_DURING_COMBAT_NODE)),
            ),
        )
    ));

    // At start of combat, if unit's HP ≥ 25% or if number of allies adjacent to unit ≤ 1,
    // deals damage = 20% of unit's Spd (including when dealing damage with a Special triggered before combat), and
    // reduces damage from foe's attacks by 20% of unit's Spd during combat (including when taking damage from a Special triggered before combat), and also,
    // when foe's attack triggers foe's Special,
    // reduces damage by 20% of unit's Spd (including when taking damage from a Special triggered before combat).
    BEFORE_AOE_SPECIAL_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        IF_NODE(OR_NODE(
                IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE,
                new LteNode(NUMBER_OF_TARGET_ALLIES_ADJACENT_TO_TARGET, 1)
            ),
            new UnitDealsDamageBeforeCombatNode(MULT_TRUNC_NODE(0.2, UNITS_SPD_AT_START_OF_COMBAT_NODE)),
            new ReducesDamageBeforeCombatNode(MULT_TRUNC_NODE(0.2, UNITS_SPD_AT_START_OF_COMBAT_NODE)),
            new ReducesDamageBeforeCombatNode(MULT_TRUNC_NODE(0.2, UNITS_SPD_AT_START_OF_COMBAT_NODE)),
        )
    ));
}

// 錬磨サンダーソード
{
    let skillId = Weapon.NewLevinSword;
    // Accelerates Special trigger (cooldown count-2; max cooldown count value cannot be reduced below 1).

    // At start of combat,
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // Unit can counterattack regardless of foe's range.
        TARGET_CAN_COUNTERATTACK_REGARDLESS_OF_RANGE_NODE,
        // Calculates damage using the lower of foe's Def or Res.
        CALCULATES_DAMAGE_USING_THE_LOWER_OF_FOES_DEF_OR_RES_NODE,
        // if foe's HP ≥ 75% or if number of allies adjacent to unit ≤ 1,
        IF_NODE(OR_NODE(IS_FOES_HP_GTE_75_PERCENT_AT_START_OF_COMBAT_NODE,
                new LteNode(NUMBER_OF_TARGET_ALLIES_ADJACENT_TO_TARGET, 1)),
            // grants Atk/Spd/Def/Res+5 to unit,
            GRANTS_ALL_STATS_PLUS_5_TO_UNIT_DURING_COMBAT_NODE,
            // grants bonus to unit's Atk/Spd/Def/Res = 15% of unit's Spd at start of combat,
            new GrantsAllStatsPlusNToUnitDuringCombatNode(MULT_TRUNC_NODE(0.15, UNITS_SPD_AT_START_OF_COMBAT_NODE)),
            // neutralizes effects that inflict "Special cooldown charge -X" on unit, and
            NEUTRALIZES_SPECIAL_COOLDOWN_CHARGE_MINUS_NODE,
            // reduces the percentage of foe's non-Special "reduce damage by X%" skills by 50% during combat (excluding area-of-effect Specials).
            REDUCES_PERCENTAGE_OF_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE,
        )
    ));
}

// 一新
{
    let skillId = PassiveB.Reopening;
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of combat,
        // if unit's HP ≥ 25%,
        IF_NODE(IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE,
            // inflicts Atk-5 on foe, inflicts Special cooldown charge -1 on foe per attack (only highest value applied; does not stack),
            new InflictsStatsMinusOnFoeDuringCombatNode(5, 0, 0, 0),
            INFLICTS_SPECIAL_COOLDOWN_CHARGE_MINUS_1_ON_FOE_NODE,
        )
    ));
    AFTER_FOLLOW_UP_CONFIGURED_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // deals damage = X% of unit's Def (excluding area-of-effect Specials), and
        new UnitDealsDamageExcludingAoeSpecialsNode(
            // if unit can make a follow-up attack or if unit triggers the "unit attacks twice" effect, X = 10; otherwise, X = 20).
            MULT_TRUNC_NODE(
                COND_OP(
                    OR_NODE(CAN_TARGET_MAKE_FOLLOW_UP_INCLUDING_POTENT_NODE, IF_TARGET_TRIGGERS_ATTACKS_TWICE_NODE),
                    0.1,
                    0.2,
                ),
                UNITS_DEF_DURING_COMBAT_NODE,
            )
        ),
        // reduces damage from foe's attacks by X% of unit's Def during combat (excluding area-of-effect Specials;
        new ReducesDamageExcludingAoeSpecialsNode(
            MULT_TRUNC_NODE(
                COND_OP(
                    OR_NODE(CAN_TARGET_MAKE_FOLLOW_UP_INCLUDING_POTENT_NODE, IF_TARGET_TRIGGERS_ATTACKS_TWICE_NODE),
                    0.1,
                    0.2,
                ),
                UNITS_DEF_DURING_COMBAT_NODE,
            )
        )
    ));
}

// 野戦築城
{
    let skillId = PassiveA.Fortifications;
    // Inflicts Atk-5. Grants Def/Res+7.
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode());
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit is in a space where a Divine Vein effect is applied,
        IF_NODE(IS_TARGET_IS_IN_SPACE_WHERE_DIVINE_VEIN_EFFECT_IS_APPLIED_NODE,
            // unit can counterattack regardless of foe's range.
            TARGET_CAN_COUNTERATTACK_REGARDLESS_OF_RANGE_NODE
        ),
        // If unit initiates combat,
        IF_NODE(DOES_UNIT_INITIATE_COMBAT_NODE,
            // grants Def/Res+6 to unit and
            new GrantsStatsPlusToUnitDuringCombatNode(0, 0, 6, 6),
            // reduces damage from foe's Specials by 10 during combat (excluding area-of-effect Specials).
            new ReducesDamageWhenFoesSpecialExcludingAoeSpecialNode(10)
        )
    ));

    AFTER_UNIT_ACTS_IF_CANTO_TRIGGERS_AFTER_CANTO_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit has entered combat during the current turn,
        // after unit acts (if Canto triggers, after Canto),
        IF_NODE(HAS_TARGET_ENTERED_COMBAT_DURING_CURRENT_TURN_NODE,
            // applies【Divine Vein (Stone)】to unit's space and spaces within 2 spaces of unit for 1 turn.
            new AppliesDivineVeinNode(
                DivineVeinType.Stone,
                new IsTargetsSpaceAndSpacesWithinNSpacesOfTargetNode(2),
            )
        )
    ));
}

// 王器
{
    let skillId = Special.MakingsOfAKing;
    // 通常攻撃奥義(範囲奥義・疾風迅雷などは除く)
    NORMAL_ATTACK_SPECIAL_SET.add(skillId);

    // 奥義カウント設定(ダメージ計算機で使用。奥義カウント2-4の奥義を設定)
    COUNT2_SPECIALS.push(skillId);

    // Boosts damage by 30% of unit's Def + Def【Great Talent】when Special triggers.
    WHEN_APPLIES_SPECIAL_EFFECTS_AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        new BoostsDamageWhenSpecialTriggersNode(
            ADD_NODE(MULT_TRUNC_NODE(UNITS_DEF_DURING_COMBAT_NODE, 0.3), UNITS_DEF_GREAT_TALENT_NODE),
        ),
    ));

    // Reduces damage from attacks during combat by percentage = 40, - 10 × current Special cooldown count value.
    AT_START_OF_ATTACK_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        new ReducesDamageFromAttacksDuringCombatByXPercentAsSpecialSkillEffectPerAttackNode(
            SUB_NODE(40, MULT_NODE(10, UNITS_CURRENT_SPECIAL_COOLDOWN_COUNT_DURING_COMBAT))
        ),
    ));

    // At start of turn,
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // grants Atk/Def/Res 【Great Talent】+2 to unit and
        new GrantsGreatTalentsPlusToTargetNode(
            StatsNode.makeStatsNodeFrom(2, 0, 2, 2),
            StatsNode.makeStatsNodeFrom(20, 20, 20, 20),
        ),
        // Atk/Def/Res 【Great Talent】+1 to allies within 3 rows or 3 columns centered on unit.
        new ForEachAllyNode(IS_TARGET_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_SKILL_OWNER_NODE,
            new GrantsGreatTalentsPlusToTargetNode(
                StatsNode.makeStatsNodeFrom(1, 0, 1, 1),
                StatsNode.makeStatsNodeFrom(10, 10, 10, 10),
            ),
        ),
    ));

    // After combat,
    AFTER_COMBAT_NEVERTHELESS_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // if unit's Special triggered,
        // grants Atk/Def/Res【Great Talent】+4 to unit and
        IF_NODE(IS_UNITS_SPECIAL_TRIGGERED,
            new GrantsGreatTalentsPlusToTargetNode(
                StatsNode.makeStatsNodeFrom(4, 0, 4, 4),
                StatsNode.makeStatsNodeFrom(20, 20, 20, 20),
            ),
            // Atk/Def/Res【Great Talent】+2 to allies within 3 rows or 3 columns centered on unit.
            new ForEachAllyNode(IS_TARGET_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_SKILL_OWNER_NODE,
                new GrantsGreatTalentsPlusToTargetNode(
                    StatsNode.makeStatsNodeFrom(2, 0, 2, 2),
                    StatsNode.makeStatsNodeFrom(10, 10, 10, 10),
                ),
            ),
        ),
    ));
    // (This skill grants max of【Great Talent】+20 for unit and 【Great Talent】+10 for allies.)
    // 【Great Talent】
    // Adds value of Great Talent (+X) to specified stats (until end of battle; max value of X is determined by the stat reaching the limit of 99, each stat calculated separately; stat increases are not treated as Bonus effects).
}

// 王斧グリトニル
{
    let skillId = Weapon.MajesticGlitnir;
    // 【再移動(マス間の距離+1、最大4)】を発動可能
    CAN_TRIGGER_CANTO_HOOKS.addSkill(skillId, () => TRUE_NODE);
    CALCULATES_DISTANCE_OF_CANTO_HOOKS.addSkill(skillId, () => CANTO_DIST_PLUS_1_MAX_4_NODE);
    // 奥義が発動しやすい(発動カウント-1)
    // ターン開始時、自身を中心とした縦3列と横3列に味方がいる時、
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        IF_NODE(IS_ALLY_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_UNIT_NODE,
            // 自身の守備、魔防+6、
            new GrantsStatsPlusAtStartOfTurnNode(0, 0, 6, 6),
            // 「移動+1」(重複しない)を付与(1ターン)、
            new GrantsStatusEffectsAtStartOfTurnNode(StatusEffectType.MobilityIncreased),
            // 奥義発動カウントが最大値なら、奥義発動カウント-1
            GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_1_IF_COUNT_IS_MAX_AT_START_OF_TURN_NODE,
        )
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // 自分から攻撃した時、または、自身を中心とした縦3列と横3列に味方がいる時、
        IF_NODE(OR_NODE(DOES_UNIT_INITIATE_COMBAT_NODE, IS_THERE_ALLY_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_UNIT_NODE),
            new NumThatIsNode(
                new SkillEffectNode(
                    // 戦闘中、自身の守備、魔防+、
                    new GrantsStatsPlusToUnitDuringCombatNode(0, 0, READ_NUM_NODE, READ_NUM_NODE),
                    // 敵の守備、魔防一○
                    new InflictsStatsMinusOnFoeDuringCombatNode(0, 0, READ_NUM_NODE, READ_NUM_NODE),
                ),
                // (○は、自身を中心とした縦3列と横3列にいる味方の数×3+5(最大14))、
                new EnsureMaxNode(
                    ADD_NODE(MULT_NODE(NUM_OF_ALLIES_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_UNIT_NODE, 3), 5),
                    14
                ),
            ),
            new AppliesSkillEffectsAfterStatusFixedNode(
                // 自分は与えるダメージ+守備の10%(範囲奥義を除く)、
                new UnitDealsDamageExcludingAoeSpecialsNode(MULT_TRUNC_NODE(UNITS_DEF_DURING_COMBAT_NODE, 0.1)),
                // 受けるダメージ-守備の10%(範囲奥義を除く)、
                new ReducesDamageExcludingAoeSpecialsNode(MULT_TRUNC_NODE(UNITS_DEF_DURING_COMBAT_NODE, 0.1)),
            ),
            // かつ奥義発動時、敵の奥義以外のスキルによる「ダメージを○○%軽減」を無効(範囲肉義を除く)
            WHEN_SPECIAL_TRIGGERS_NEUTRALIZES_FOES_REDUCES_DAMAGE_BY_PERCENTAGE_EFFECTS_FROM_FOES_NON_SPECIAL_EXCLUDING_AOE_SPECIALS_NODE,
        )
    ));
    // 自分から攻撃した時、または、自身を中心とした縦3列と横3列に味方がいる時、戦闘後、奥義発動カウントが最大値なら、奥義発動カウント-1
    AFTER_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        IF_NODE(OR_NODE(DOES_UNIT_INITIATE_COMBAT_NODE, IS_THERE_ALLY_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_UNIT_NODE),
            GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_1_IF_COUNT_IS_MAX_AFTER_COMBAT_NODE,
        )
    ));
}

// 落星・承
{
    let skillId = PassiveB.FallenStar2;
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () =>
        new SkillEffectNode(
            new IfNode(new OrNode(DOES_UNIT_INITIATE_COMBAT_NODE,
                    IS_STATUS_EFFECT_ACTIVE_ON_TARGET_NODE(StatusEffectType.DeepStar)),
                new InflictsStatsMinusOnFoeDuringCombatNode(0, 5, 5, 0),
                new UnitDealsDamageExcludingAoeSpecialsNode(
                    new EnsureMaxNode(
                        new MultNode(NUM_OF_BONUS_ON_UNIT_PLUS_NUM_OF_PENALTY_ON_FOE_EXCLUDING_STAT_NODE, 5),
                        25
                    ),
                ),
                new ReducesDamageFromFoesFirstAttackByNDuringCombatIncludingTwiceNode(
                    new EnsureMaxNode(
                        new MultNode(NUM_OF_BONUS_ON_UNIT_PLUS_NUM_OF_PENALTY_ON_FOE_EXCLUDING_STAT_NODE, 3),
                        15
                    ),
                ),
            ),
            new IfNode(DOES_UNIT_INITIATE_COMBAT_NODE,
                new ReducesDamageFromFoesFirstAttackByNPercentDuringCombatIncludingTwiceNode(80),
            )
        )
    );
    AFTER_COMBAT_HOOKS.addSkill(skillId, () =>
        new SkillEffectNode(
            // If unit initiates combat,
            new IfNode(DOES_UNIT_INITIATE_COMBAT_NODE,
                // grants【Deep Star】to unit and
                new GrantsStatusEffectsAfterCombatNode(StatusEffectType.DeepStar),
                // inflicts【Gravity】on target and foes within 1 space of target after combat.
                FOR_EACH_TARGET_AND_FOE_WITHIN_1_SPACE_OF_TARGET_NODE(
                    new GrantsStatusEffectsAfterCombatNode(StatusEffectType.Gravity),
                ),
            )
        )
    );
}

// ユングヴィの祖・神
{
    let skillId = PassiveB.YngviAscendantPlus;
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () =>
        new SkillEffectNode(
            new InflictsStatsMinusOnFoeDuringCombatNode(0, 5, 5, 0),
            NULL_UNIT_FOLLOW_UP_NODE,
            new IfNode(DOES_UNIT_INITIATE_COMBAT_NODE,
                UNIT_CAN_MAKE_FOLLOW_UP_ATTACK_BEFORE_FOES_NEXT_ATTACK_NODE
            ),
        )
    );
    WHEN_APPLIES_POTENT_EFFECTS_HOOKS.addSkill(skillId, () =>
        POTENT_FOLLOW_N_PERCENT_NODE(100, -10)
    );
}

// 射的の弓+
{
    let skillId = Weapon.StallGameBowPlus;
    // 飛行特効
    // ターン開始時、自身のHPが25%以上なら、自分の攻撃+6、「自分から攻撃時、絶対追撃」を付与(1ターン)
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () =>
        new IfNode(IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_TURN_NODE,
            new GrantsStatsPlusAtStartOfTurnNode(6, 0, 0, 0),
            new GrantsStatusEffectsAtStartOfTurnNode(StatusEffectType.FollowUpAttackPlus),
        )
    );
    // 戦闘開始時、自身のHPが25%以上なら、戦闘中、攻撃、速さ、守備、魔防+4、ダメージ+○×5(最大25、範囲奥義を除く)(○は自身と敵が受けている強化を除いた【有利な状態】の数の合計値)
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () =>
        new IfNode(IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE,
            GRANTS_ALL_STATS_PLUS_4_TO_UNIT_DURING_COMBAT_NODE,
            new UnitDealsDamageExcludingAoeSpecialsNode(
                new EnsureMaxNode(new MultNode(NUM_OF_BONUS_ON_UNIT_AND_FOE_EXCLUDING_STAT_NODE, 5), 25)
            ),
        )
    )
}

// 双界ネフェニーの双界スキル
{
    WHEN_TRIGGERS_DUO_OR_HARMONIZED_EFFECT_HOOKS_MAP.addValue(Hero.HarmonizedNephenee,
        new SkillEffectNode(
            new ForEachUnitFromSameTitlesNode(
                new GrantsStatsNode(6, 6, 0, 0),
                new GrantsStatusEffectsNode(
                    StatusEffectType.ResonantBlades,
                    StatusEffectType.MobilityIncreased,
                ),
                NEUTRALIZES_ANY_PENALTY_ON_TARGET_NODE,
            )
        )
    )
}

// 攻撃速さの制空
{
    let skillId = PassiveA.AtkSpdMastery;
    // 現在のターン中に自分が戦闘を行っている時、【再移動(2)】を発動可能
    CAN_TRIGGER_CANTO_HOOKS.addSkill(skillId, () =>
        HAS_TARGET_ENTERED_COMBAT_DURING_CURRENT_TURN_NODE,
    );
    CALCULATES_DISTANCE_OF_CANTO_HOOKS.addSkill(skillId, () => NumberNode.makeNumberNodeFrom(2));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () =>
        new SkillEffectNode(
            // 戦闘開始時、敵のHPが50%以上の時、戦闘中、
            new IfNode(IS_FOES_HP_GTE_50_PERCENT_AT_START_OF_COMBAT_NODE,
                // 自分の攻撃、速さ+7、かつ
                GRANTS_ATK_SPD_PLUS_7_TO_UNIT_DURING_COMBAT_NODE,
                // 自身の周囲2マス以内に以下のいずれかのマスがある時、戦闘中、さらに、
                new IfNode(IS_THERE_SPACE_WITHIN_2_SPACES_THAT_HAS_DIVINE_VEIN_OR_COUNTS_AS_DIFFICULT_TERRAIN_EXCLUDING_IMPASSABLE_TERRAIN_NODE,
                    // 自分の攻撃、速さ+4(・天脈が付与されたマス・いずれかの移動タイプが侵入可能で、平地のように移動できない地形のマス)
                    GRANTS_ATK_SPD_PLUS_4_TO_UNIT_DURING_COMBAT_NODE
                )
            )
        )
    );
}

// 人見知りの縁の祭器
{
    let skillId = Weapon.FlutteringFan;
    // 奥義が発動しやすい(発動カウント-1)
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () =>
        new SkillEffectNode(
            // 自身を中心とした縦3列と横3列に味方がいる時、戦闘中、
            new IfNode(IS_THERE_ALLY_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_UNIT_NODE,
                // 自身の攻撃、速さ、守備、魔防が自身を中心とした縦3列と横3列にいる敵の数×3+5だけ増加
                // (最大14、自身の周囲2マス以内に以下のいずれかのマスがある時は14として扱う・天脈が付与されたマス・いずれかの移動タイプが侵入可能で、平地のように移動できない地形のマス)、
                new GrantsAllStatsPlusNToUnitDuringCombatNode(
                    new TernaryConditionalNumberNode(
                        IS_THERE_SPACE_WITHIN_2_SPACES_THAT_HAS_DIVINE_VEIN_OR_COUNTS_AS_DIFFICULT_TERRAIN_EXCLUDING_IMPASSABLE_TERRAIN_NODE,
                        14,
                        new EnsureMaxNode(
                            new AddNode(new MultNode(NUM_OF_FOES_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_UNIT_NODE, 3), 5),
                            14,
                        ),
                    ),
                ),
                // 敵の速さ、魔防の強化の+を無効にする(無効になるのは、鼓舞や応援等の+効果)、
                new NeutralizesFoesBonusesToStatsDuringCombatNode(false, true, false, true),
                // かつ自分が攻撃時に発動する奥義を装備している時、戦闘中、
                new IfNode(CAN_UNITS_ATTACK_TRIGGER_SPECIAL_NODE,
                    // 自分の最初の攻撃前に奥義発動カウント-1、
                    UNIT_GRANTS_SPECIAL_COOLDOWN_MINUS_1_TO_UNIT_BEFORE_UNITS_FIRST_ATTACK_NODE,
                    // 自分の最初の追撃前に奥義発動カウント-1、かつ
                    UNIT_GRANTS_SPECIAL_COOLDOWN_MINUS_1_TO_UNIT_BEFORE_UNITS_FIRST_FOLLOW_UP_ATTACK_NODE,
                    new TargetAppliesSkillEffectsPerAttackNode(
                        // 自身のHPが99%以下で
                        new IfNode(IS_UNITS_HP_LTE_99_PERCENT_IN_COMBAT_NODE,
                            // 奥義発動時、戦闘中、自分の奥義によるダメージ+10
                            new DealsDamageWhenTriggeringSpecialDuringCombatPerAttackNode(10),
                        ),
                    ),
                ),
            )
        )
    );
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () =>
        new SkillEffectNode(
            // 自身を中心とした縦3列と横3列に味方がいる時、
            // 戦闘中、速さが敵より1以上高ければ、敵は反撃不可
            new IfNode(IS_THERE_ALLY_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_UNIT_NODE,
                new AppliesSkillEffectsAfterStatusFixedNode(
                    new IfNode(new GtNode(UNITS_EVAL_SPD_DURING_COMBAT_NODE, FOES_EVAL_SPD_DURING_COMBAT_NODE),
                        FOE_CANNOT_COUNTERATTACK_NODE,
                    ),
                ),
            ),
        )
    );
    FOR_ALLIES_GRANTS_EFFECTS_TO_ALLIES_DURING_COMBAT_HOOKS.addSkill(skillId, () =>
        // 自身を中心とした縦3列と横3列の味方は、
        new IfNode(IS_ALLY_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_UNIT_NODE,
            // 攻撃時に発動する奥義を装備している時、戦闘中、
            new IfNode(CAN_UNITS_ATTACK_TRIGGER_SPECIAL_NODE,
                // 奥義発動カウント変動量-を無効、
                NEUTRALIZES_SPECIAL_COOLDOWN_CHARGE_MINUS_NODE,
                // 自分の最初の攻撃前に奥義発動カウント-1、
                UNIT_GRANTS_SPECIAL_COOLDOWN_MINUS_1_TO_UNIT_BEFORE_UNITS_FIRST_ATTACK_NODE,
                new TargetAppliesSkillEffectsPerAttackNode(
                    // 自身のHPが99%以下で
                    new IfNode(IS_UNITS_HP_LTE_99_PERCENT_IN_COMBAT_NODE,
                        // 奥義発動時、戦闘中、自分の奥義によるダメージ+10
                        new DealsDamageWhenTriggeringSpecialDuringCombatPerAttackNode(10),
                    ),
                ),
            )
        )
    );
}

// 夏野菜の桶+
{
    let skillId = Weapon.JuicyBucketfulPlus;
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () =>
        // ターン開始時、自身のHPが25%以上なら、自分の攻撃+6、「自分から攻撃時、絶対追撃」を付与(1ターン)
        new IfNode(IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_TURN_NODE,
            new GrantsStatsPlusAtStartOfTurnNode(6, 0, 0, 0),
            new GrantsStatusEffectsAtStartOfTurnNode(StatusEffectType.FollowUpAttackPlus),
        )
    );
    // 戦闘開始時、自身のHPが25%以上なら、戦闘中、攻撃、速さ、守備、魔防+4、ダメージ+○×5(最大25、範囲奥義を除く)(○は自身と敵が受けている強化を除いた【有利な状態】の数の合計値)
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () =>
        new IfNode(IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE,
            GRANTS_ALL_STATS_PLUS_4_TO_UNIT_DURING_COMBAT_NODE,
            new UnitDealsDamageExcludingAoeSpecialsNode(
                new EnsureMaxNode(new MultNode(NUM_OF_BONUS_ON_UNIT_AND_FOE_EXCLUDING_STAT_NODE, 5), 25)
            ),
        )
    );
}

// 再移動制限・不惑
{
    let skillId = PassiveC.FirmCantoCurb;
    CAN_INFLICT_CANTO_CONTROL_HOOKS.addSkill(skillId, () =>
        CAN_INFLICT_CANTO_CONTROL_WITHIN_4_SPACES_NODE,
    );
    CAN_NEUTRALIZE_END_ACTION_BY_SKILL_EFFECTS_HOOKS.addSkill(skillId, () =>
        CAN_NEUTRALIZE_END_ACTION_WITHIN_3_SPACES_NODE
    );
    CAN_NEUTRALIZE_STATUS_EFFECTS_HOOKS.addSkill(skillId, () =>
        CAN_NEUTRALIZE_ACTION_ENDS_SKILL_FOR_UNIT_AND_ALLIES_WITHIN_3_SPACES_NODE,
    );
    CAN_NEUTRALIZE_END_ACTION_BY_STATUS_EFFECTS_HOOKS.addSkill(skillId, () =>
        CAN_NEUTRALIZE_END_ACTION_WITHIN_3_SPACES_NODE
    );
}

// 清風明月の夏祭の槍
{
    let skillId = Weapon.BreezySpear;
    BEFORE_AOE_SPECIAL_ACTIVATION_CHECK_HOOKS.addSkill(skillId, () =>
        new SkillEffectNode(
            // 範囲奥義無効
            UNIT_CANNOT_TRIGGER_AREA_OF_EFFECT_SPECIALS_NODE,
            FOE_CANNOT_TRIGGER_AREA_OF_EFFECT_SPECIALS_NODE,
            // 防御地形無効
            UNIT_DISABLES_DEFENSIVE_TERRAIN_EFFECTS,
            FOE_DISABLES_DEFENSIVE_TERRAIN_EFFECTS,
            // 支援無効
            UNIT_DISABLES_SUPPORT_EFFECTS,
            FOE_DISABLES_SUPPORT_EFFECTS,
        ),
    );
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () =>
        new SkillEffectNode(
            GRANTS_ALL_STATS_PLUS_5_TO_UNIT_DURING_COMBAT_NODE,
            new GrantsAllStatsPlusNToUnitDuringCombatNode(new MultTruncNode(UNITS_SPD_AT_START_OF_COMBAT_NODE, 0.15)),
            new AppliesSkillEffectsAfterStatusFixedNode(
                new UnitDealsDamageExcludingAoeSpecialsNode(
                    new MultTruncNode(UNITS_SPD_DURING_COMBAT_NODE, 0.20),
                ),
            ),
            // 奥義無効
            UNIT_CANNOT_TRIGGER_ATTACKER_SPECIAL,
            FOE_CANNOT_TRIGGER_ATTACKER_SPECIAL,
            UNIT_CANNOT_TRIGGER_DEFENDER_SPECIAL,
            FOE_CANNOT_TRIGGER_DEFENDER_SPECIAL,
            // 見切り追撃
            NULL_UNIT_FOLLOW_UP_NODE,
            NULL_FOE_FOLLOW_UP_NODE,
            // 攻撃順序入れ替えスキル無効
            UNIT_DISABLES_SKILLS_THAT_CHANGE_ATTACK_PRIORITY,
            FOE_DISABLES_SKILLS_THAT_CHANGE_ATTACK_PRIORITY,
            // 暗闘
            UNIT_DISABLES_SKILLS_OF_ALL_OTHERS_IN_COMBAT_EXCLUDING_UNIT_AND_FOE_NODE,
            FOE_DISABLES_SKILLS_OF_ALL_OTHERS_IN_COMBAT_EXCLUDING_UNIT_AND_FOE_NODE,
            // 反撃不可無効
            UNIT_DISABLES_SKILLS_THAT_PREVENT_COUNTERATTACKS_NODE,
            FOE_DISABLES_SKILLS_THAT_PREVENT_COUNTERATTACKS_NODE,
        )
    );
}

// 天馬裂空
{
    let skillId = PassiveB.PegasusRift;
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () =>
        new SkillEffectNode(
            new InflictsStatsMinusOnFoeDuringCombatNode(4, 4, 0, 0),
            new AppliesSkillEffectsAfterStatusFixedNode(
                new IfNode(new IsGteSumOfStatsDuringCombatExcludingPhantomNode(0, -10, [0, 1, 0, 1]),
                    new UnitDealsDamageExcludingAoeSpecialsNode(
                        new EnsureMinMaxNode(new AddNode(UNITS_RES_AT_START_OF_COMBAT_NODE, -30), 0, 10)
                    ),
                    new ReducesDamageFromFoesFirstAttackByNDuringCombatIncludingTwiceNode(
                        new EnsureMinMaxNode(new AddNode(UNITS_RES_AT_START_OF_COMBAT_NODE, -30), 0, 10)
                    ),
                    UNIT_MAKES_GUARANTEED_FOLLOW_UP_ATTACK_NODE,
                    FOE_CANNOT_MAKE_FOLLOW_UP_ATTACK_NODE,
                    new IncreasesSpdDiffNecessaryForTargetsFoesFollowUpNode(20),
                ),
            ),
        ),
    );
}

// 意気軒昂の夏祭の斧
{
    let skillId = Weapon.SummertimeAxe;
    CAN_TRIGGER_CANTO_HOOKS.addSkill(skillId, () => TRUE_NODE);
    CALCULATES_DISTANCE_OF_CANTO_HOOKS.addSkill(skillId, () => CANTO_REM_PLUS_ONE_NODE);

    AT_START_OF_TURN_HOOKS.addSkill(skillId, () =>
        new SkillEffectNode(
            new IfNode(IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_TURN_NODE,
                new GrantsStatsPlusAtStartOfTurnNode(0, 6, 6, 6),
                new GrantsStatusEffectsAtStartOfTurnNode(
                    StatusEffectType.ShieldFlying,
                    StatusEffectType.ReducesPercentageOfFoesNonSpecialReduceDamageSkillsBy50Percent
                ),
            )
        )
    );
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () =>
        new SkillEffectNode(
            new IfNode(IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE,
                new GrantsAllStatsPlusNToUnitDuringCombatNode(new MultTruncNode(UNITS_SPD_AT_START_OF_COMBAT_NODE, 0.15)),
                NEUTRALIZES_SPECIAL_COOLDOWN_CHARGE_MINUS_NODE,
                new UnitDealsDamageExcludingAoeSpecialsNode(
                    new EnsureMaxNode(new MultNode(NUM_OF_BONUS_ON_UNIT_AND_FOE_EXCLUDING_STAT_NODE, 5), 30)
                ),
                new ReducesDamageExcludingAoeSpecialsNode(
                    new EnsureMaxNode(new MultNode(NUM_OF_BONUS_ON_UNIT_AND_FOE_EXCLUDING_STAT_NODE, 3), 18)
                ),
                new ReducesDamageWhenFoesSpecialExcludingAoeSpecialNode(
                    new EnsureMaxNode(new MultNode(NUM_OF_BONUS_ON_UNIT_AND_FOE_EXCLUDING_STAT_NODE, 3), 18)
                ),
                RESTORES_7_HP_TO_UNIT_AFTER_COMBAT_NODE,
            )
        )
    );
}

// 虎の剛斧
{
    let [normalId, refinementId, specialRefinementId] = getRefinementSkillIds(Weapon.TigerRoarAxe);
    // 通常
    // Accelerates Special trigger (cooldown count-1).
    AT_START_OF_COMBAT_HOOKS.addSkill(normalId, () => new SkillEffectNode(
        // If unit initiates combat or if unit is within 2 spaces of an ally,
        IF_NODE(OR_NODE(DOES_UNIT_INITIATE_COMBAT_NODE, IS_TARGET_WITHIN_2_SPACES_OF_TARGETS_ALLY_NODE),
            // grants Atk/Spd/Def/Res+5 during combat,
            GRANTS_ALL_STATS_PLUS_5_TO_UNIT_DURING_COMBAT_NODE,
            // and also,
            // at start of combat,
            // if foe's HP = 100%,
            IF_NODE(new IsUnitsHpGteNPercentAtStartOfCombatNode(100),
                // unit makes a guaranteed follow-up attack.
                UNIT_MAKES_GUARANTEED_FOLLOW_UP_ATTACK_NODE,
            ),
        ),
    ));

    // 錬成
    // Tiger-Roar Axe can be upgraded in the Weapon Refinery.
    // When upgraded,
    // the description of Tiger-Roar Axe becomes "Accelerates Special trigger (cooldown count-1).
    AT_START_OF_COMBAT_HOOKS.addSkill(refinementId, () => new SkillEffectNode(
        // If unit initiates combat or unit is within 2 spaces of an ally,
        IF_NODE(OR_NODE(DOES_UNIT_INITIATE_COMBAT_NODE, IS_TARGET_WITHIN_2_SPACES_OF_TARGETS_ALLY_NODE),
            // grants Atk/Spd/Def/Res+5 to unit,
            GRANTS_ALL_STATS_PLUS_5_TO_UNIT_DURING_COMBAT_NODE,
            // unit makes a guaranteed follow-up attack,
            UNIT_MAKES_GUARANTEED_FOLLOW_UP_ATTACK_NODE,
            new AppliesSkillEffectsAfterStatusFixedNode(
                // and reduces damage from foe's attacks by 20% of unit's Def during combat (excluding area-of-effect Specials).".
                new ReducesDamageExcludingAoeSpecialsNode(MULT_TRUNC_NODE(0.2, UNITS_DEF_DURING_COMBAT_NODE)),
            ),
        ),
    ));

    // 特殊錬成
    // Tiger-Roar Axe can be upgraded with the additional effect Tiger-Roar Axe W
    AT_START_OF_COMBAT_HOOKS.addSkill(specialRefinementId, () => new SkillEffectNode(
        // "If foe initiates combat or foe's HP ≥ 75% at start of combat,
        IF_NODE(OR_NODE(DOES_FOE_INITIATE_COMBAT_NODE, IS_FOES_HP_GTE_75_PERCENT_AT_START_OF_COMBAT_NODE),
            new NumThatIsNode(
                // grants bonus to unit's Atk/Spd/Def/Res =
                new GrantsAllStatsPlusNToUnitDuringCombatNode(READ_NUM_NODE),
                // 4 + number of foes within 3 rows or 3 columns centered on unit × 2 (max 10),
                new EnsureMaxNode(
                    ADD_NODE(4, MULT_NODE(NUM_OF_FOES_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_UNIT_NODE, 2)), 10),
            ),
            // inflicts Special cooldown charge -1 on foe per attack (only highest value applied; does not stack),
            INFLICTS_SPECIAL_COOLDOWN_CHARGE_MINUS_1_ON_FOE_NODE,
            // and grants Special cooldown count-1 to unit before unit's first attack during combat.".
            new GrantsSpecialCooldownCountMinusNToTargetBeforeTargetsFirstAttackDuringCombatNode(1),
        ),
    ));
}

// アッサルの槍
{
    let skillId = getSpecialRefinementSkillId(Weapon.SpearOfAssal);
    // Spear of Assal can be upgraded with the additional effect Spear of Assal W
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // "If unit is within 3 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_TARGETS_ALLY_NODE,
            // grants Atk/Spd/Def/Res+4 to unit,
            GRANTS_ALL_STATS_PLUS_4_TO_UNIT_DURING_COMBAT_NODE,
            // unit deals +7 damage (excluding area-of-effect Specials),
            new UnitDealsDamageExcludingAoeSpecialsNode(7),
            // and reduces damage from foe's first attack by 7 during combat
            new ReducesDamageFromFoesFirstAttackByNDuringCombatIncludingTwiceNode(7),
            // ("first attack" normally means only the first strike; for effects that grant "unit attacks twice," it means the first and second strikes),
            // and restores 7 HP to unit after combat.
            RESTORES_7_HP_TO_UNIT_AFTER_COMBAT_NODE,
        )
    ));

    // For allies
    // noinspection GrazieInspection
    FOR_ALLIES_GRANTS_STATS_PLUS_TO_ALLIES_DURING_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // within 3 spaces of unit,
        IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_SKILL_OWNER_NODE,
            // grants Atk/Spd/Def/Res+4 to ally,
            GRANTS_ALL_STATS_PLUS_4_TO_TARGET_DURING_COMBAT_NODE,
            // ally deals +7 damage (excluding area-of-effect Specials), and
            new TargetDealsDamageExcludingAoeSpecialsNode(7),
            // reduces damage from foe's first attack by 7 during their combat
            new ReducesDamageFromFoesFirstAttackByNDuringCombatIncludingTwiceNode(7),
            // ("first attack" normally means only the first strike; for effects that grant "unit attacks twice," it means the first and second strikes).".
        )
    ));
}
{
    let skillId = getRefinementSkillId(Weapon.SpearOfAssal);
    // When upgraded, the description of Spear of Assal becomes

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // Effective against cavalry foes.
        new EffectiveAgainstNode(EffectiveType.Cavalry),
        // Grants Spd+3.
        // If unit is within 3 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_TARGETS_ALLY_NODE,
            // grants Atk/Spd/Def/Res+4 to unit and
            GRANTS_ALL_STATS_PLUS_4_TO_UNIT_DURING_COMBAT_NODE,
            // neutralizes foe's bonuses (from skills like Fortify, Rally, etc.) during combat.
            NEUTRALIZES_FOES_BONUSES_TO_STATS_DURING_COMBAT_NODE,
        )
    ));

    // to allies within 3 spaces of unit and
    FOR_ALLIES_GRANTS_STATS_PLUS_TO_ALLIES_DURING_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_SKILL_OWNER_NODE,
            // Grants Atk/Spd/Def/Res+4
            GRANTS_ALL_STATS_PLUS_4_TO_UNIT_DURING_COMBAT_NODE,
        )
    ));

    FOR_ALLIES_GRANTS_EFFECTS_TO_ALLIES_DURING_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        IF_NODE(IS_TARGET_WITHIN_3_SPACES_OF_SKILL_OWNER_NODE,
            // neutralizes foe's bonuses (from skills like Fortify, Rally, etc.) during their combat
            NEUTRALIZES_FOES_BONUSES_TO_STATS_DURING_COMBAT_NODE,
        )
    ));
}
{
    let skillId = getNormalSkillId(Weapon.SpearOfAssal);
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (!calcPotentialDamage && this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                targetUnit.addAtkSpdSpurs(4);
                targetUnit.battleContext.invalidatesAtkBuff = true;
                targetUnit.battleContext.invalidatesSpdBuff = true;
            }
        }
    );
    updateUnitSpurFromAlliesFuncMap.set(skillId,
        function (targetUnit, allyUnit, calcPotentialDamage, enemyUnit) {
            // 周囲2マス以内
            if (targetUnit.distance(allyUnit) <= 2) {
                targetUnit.addAtkSpdSpurs(4);
            }
        }
    );
}

// 盛夏の神宝
{
    let skillId = getSpecialRefinementSkillId(Weapon.SunsPercussors);
    // Sun's Percussors can be upgraded with the additional effect Suns Percussors W
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // "If unit initiates combat or is within 3 spaces of an ally,
        IF_NODE(OR_NODE(DOES_UNIT_INITIATE_COMBAT_NODE, IS_TARGET_WITHIN_3_SPACES_OF_TARGETS_ALLY_NODE),
            // grants bonus to unit's Atk/Spd/Def/Res = number of allies within 3 spaces of unit × 2, + 4 (max 10) and
            new NumThatIsNode(
                new GrantsAllStatsPlusNToUnitDuringCombatNode(READ_NUM_NODE),
                new EnsureMaxNode(ADD_NODE(MULT_NODE(new NumOfTargetsAlliesWithinNSpacesNode(3), 2), 4), 10),
            ),
            new AppliesSkillEffectsAfterStatusFixedNode(
                // deals damage = 15% of unit's Spd during combat (excluding area-of-effect Specials).
                new UnitDealsDamageExcludingAoeSpecialsNode(UNITS_SPD_DURING_COMBAT_NODE),
            ),
            // If unit initiates combat,
            IF_NODE(DOES_UNIT_INITIATE_COMBAT_NODE,
                // reduces damage from foe's first attack by 50% during combat
                new ReducesDamageFromFoesFirstAttackByNPercentDuringCombatIncludingTwiceNode(50),
                // ("first attack" normally means only the first strike; for effects that grant "unit attacks twice," it means the first and second strikes),
                // and also,
                // if foe's attack can trigger foe's Special,
                IF_NODE(CAN_UNITS_ATTACK_TRIGGER_SPECIAL_NODE,
                    // inflicts Special cooldown count+1 on foe before foe's first attack (cannot exceed the foe's maximum Special cooldown).".
                    new InflictsSpecialCooldownCountPlusNOnTargetsFoeBeforeTargetsFoesFirstAttackNode(1),
                ),
            ),
        ),
    ));
}

{
    let skillId = getRefinementSkillId(Weapon.SunsPercussors);
    // When upgraded, the description of Sun's Percussors becomes "Accelerates Special trigger (cooldown count-1).
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of combat,
        // if unit's Spd ≥ foe's Spd-5 or if foe's HP ≥ 75%,
        IF_NODE(OR_NODE(
                GT_NODE(UNITS_EVAL_SPD_AT_START_OF_COMBAT_NODE, SUB_NODE(FOES_EVAL_SPD_AT_START_OF_COMBAT_NODE, 5)),
                IS_FOES_HP_GTE_75_PERCENT_AT_START_OF_COMBAT_NODE
            ),
            // grants Atk/Spd+5 and Def/Res+4 to unit,
            new GrantsStatsPlusToUnitDuringCombatNode(5, 5, 4, 4),
            // neutralizes effects that guarantee foe's follow-up attacks and effects that prevent unit's follow-up attacks,
            NULL_UNIT_FOLLOW_UP_NODE,
            // neutralizes effects that inflict "Special cooldown charge -X" on unit,
            NEUTRALIZES_EFFECTS_THAT_INFLICT_SPECIAL_COOLDOWN_CHARGE_MINUS_X_ON_UNIT,
            // and reduces the percentage of foe's non-Special "reduce damage by X%" skills by 50% during combat (excluding area-of-effect Specials).
            REDUCES_PERCENTAGE_OF_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE,
        )
    ));

    FOR_ALLIES_GRANTS_STATS_PLUS_TO_ALLIES_DURING_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // Grants Atk/Spd+4 and
        // to allies within 2 spaces of unit during their combat.".
        IF_NODE(IS_TARGET_WITHIN_2_SPACES_OF_SKILL_OWNER_NODE,
            new GrantsStatsPlusToTargetDuringCombatNode(4, 4, 0, 0),
        ),
    ));

    FOR_ALLIES_GRANTS_EFFECTS_TO_ALLIES_DURING_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // "reduces the percentage of foe's non-Special 'reduce damage by X%' skills by 50% (excluding area-of-effect Specials)"
        // to allies within 2 spaces of unit during their combat.".
        IF_NODE(IS_TARGET_WITHIN_2_SPACES_OF_SKILL_OWNER_NODE,
            REDUCES_PERCENTAGE_OF_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE,
        ),
    ));
}

{
    let skillId = getNormalSkillId(Weapon.SunsPercussors);
    // Accelerates Special trigger (cooldown count-1).
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of combat,
        // if unit's Spd > foe's Spd or if foe's HP = 100%,
        IF_NODE(OR_NODE(
                GT_NODE(UNITS_EVAL_SPD_AT_START_OF_COMBAT_NODE, FOES_EVAL_SPD_AT_START_OF_COMBAT_NODE),
                EQ_NODE(FOES_HP_PERCENTAGE_AT_START_OF_COMBAT_NODE, 100),
            ),
            // grants Atk/Spd+5 to unit during combat and
            GRANTS_ATK_SPD_PLUS_5_TO_UNIT_DURING_COMBAT_NODE,
            // neutralizes effects that guarantee foe's follow-up attacks and effects that prevent unit's follow-up attacks.
            NULL_UNIT_FOLLOW_UP_NODE,
        ),
    ));
}

// フェイルノート
{
    let skillId = getSpecialRefinementSkillId(Weapon.Failnaught);
    CAN_TRIGGER_CANTO_HOOKS.addSkill(skillId, () => TRUE_NODE);
    CALCULATES_DISTANCE_OF_CANTO_HOOKS.addSkill(skillId, () => NumberNode.makeNumberNodeFrom(1));
    FOR_ALLIES_GRANTS_STATS_PLUS_TO_ALLIES_DURING_COMBAT_HOOKS.addSkill(skillId, () => TRUE_NODE);
    FOR_FOES_INFLICTS_STATS_MINUS_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        IF_NODE(IS_TARGET_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_SKILL_OWNER_NODE,
            new InflictsStatsMinusOnUnitDuringCombatNode(0, 5, 5, 0),
        ),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        IF_NODE(IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE,
            GRANTS_ALL_STATS_PLUS_4_TO_UNIT_DURING_COMBAT_NODE,
            NEUTRALIZES_SPECIAL_COOLDOWN_CHARGE_MINUS_NODE,
            REDUCES_PERCENTAGE_OF_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE,
        )
    ));
}

{
    let skillId = getRefinementSkillId(Weapon.Failnaught);
    // 飛行特効
    // 奥義が発動しやすい(発動カウント-1)
    AT_START_OF_TURN_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // ターン開始時、自身のHPが25%以上なら
        IF_NODE(IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_TURN_NODE,
            // 最も近い敵とその周囲2マス以内の敵の速さ、守備-7、【キャンセル】、【混乱】を付与(敵の次回行動終了まで)
            FOR_EACH_TARGETS_CLOSEST_FOE_AND_ANY_FOE_WITHIN_2_SPACES_OF_THOSE_FOES_NODE(
                new InflictsStatsMinusAtStartOfTurnNode(0, 7, 7, 0),
                new GrantsStatusEffectsAtStartOfTurnNode(StatusEffectType.Guard, StatusEffectType.Sabotage),
            )
        )
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // 戦闘開始時、自身のHPが25%以上なら戦闘中、攻撃、速さ、守備、魔防+5、かつ、敵の絶対追撃を無効、かつ、自分の追撃不可を無効
        IF_NODE(IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE,
            GRANTS_ALL_STATS_PLUS_5_TO_UNIT_DURING_COMBAT_NODE,
            NULL_UNIT_FOLLOW_UP_NODE)
    ));
}

{
    let skillId = getNormalSkillId(Weapon.Failnaught);
    // 飛行特効
    // 奥義が発動しやすい(発動カウント-1)
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // 戦闘開始時、自身のHPが25%以上なら戦闘中、攻撃、速さ、守備、魔防+5、かつ、敵の絶対追撃を無効、かつ、自分の追撃不可を無効
        IF_NODE(IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE,
            GRANTS_ALL_STATS_PLUS_5_TO_UNIT_DURING_COMBAT_NODE,
            NULL_UNIT_FOLLOW_UP_NODE
        )
    ));
}

// 聖弓イチイバル
{
    let skillId = getSpecialRefinementSkillId(Weapon.HolyYewfelle);

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () =>
        new SkillEffectNode(
            new IfNode(IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE,
                GRANTS_ATK_SPD_PLUS_5_TO_UNIT_DURING_COMBAT_NODE,
                new NumThatIsNode(
                    new GrantsStatsPlusToUnitDuringCombatNode(READ_NUM_NODE, READ_NUM_NODE, 0, 0),
                    new MultTruncNode(UNITS_SPD_AT_START_OF_COMBAT_NODE, 0.15),
                ),
                new NeutralizesFoesBonusesToStatsDuringCombatNode(false, true, true, false),
                REDUCES_PERCENTAGE_OF_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE,
            )
        )
    );
}
{
    let skillId = getRefinementSkillId(Weapon.HolyYewfelle);
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () =>
        new SkillEffectNode(
            new IfNode(new OrNode(DOES_UNIT_INITIATE_COMBAT_NODE, IS_FOES_HP_GTE_75_PERCENT_AT_START_OF_COMBAT_NODE),
                GRANTS_ATK_SPD_PLUS_6_TO_UNIT_DURING_COMBAT_NODE,
                new NeutralizesPenaltiesToUnitsStatsNode(true, true, false, false),
                NEUTRALIZES_SPECIAL_COOLDOWN_CHARGE_MINUS_NODE,
                UNIT_DISABLES_SKILLS_OF_ALL_OTHERS_IN_COMBAT_EXCLUDING_UNIT_AND_FOE_NODE,
            )
        )
    );
}
{
    let skillId = getNormalSkillId(Weapon.HolyYewfelle);
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () =>
        new SkillEffectNode(
            new IfNode(new OrNode(DOES_UNIT_INITIATE_COMBAT_NODE, IS_FOES_HP_GTE_75_PERCENT_AT_START_OF_COMBAT_NODE),
                GRANTS_ATK_SPD_PLUS_6_TO_UNIT_DURING_COMBAT_NODE,
                new NeutralizesPenaltiesToUnitsStatsNode(true, true, false, false),
                NEUTRALIZES_SPECIAL_COOLDOWN_CHARGE_MINUS_NODE,
            )
        )
    );
}
