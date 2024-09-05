// noinspection JSUnusedLocalSymbols
// 悠遠のブレス
{
    let skillId = getNormalSkillId(Weapon.RemoteBreath);
    // Accelerates Special trigger (cooldown count-1).
    // Effective against dragon foes.
    // If foe's Range = 2,
    // calculates damage using the lower of foe's Def or Res.
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
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
                IF_NODE(CAN_FOES_ATTACK_TRIGGER_SPECIAL_NODE,
                    new AppliesSkillEffectsAfterStatusFixedNode(
                        IF_NODE(GTE_NODE(
                                UNITS_EVAL_RES_DURING_COMBAT_NODE,
                                ADD_NODE(FOES_EVAL_RES_DURING_COMBAT_NODE, 5)),
                            // inflicts Special cooldown count+1 on foe before foe's first attack during combat.
                            // (Cannot exceed the foe's maximum Special cooldown.)
                            INFLICTS_SPECIAL_COOLDOWN_COUNT_PLUS_N_ON_FOE_BEFORE_FOES_FIRST_ATTACK(1),
                        ),
                    ),
                ),
            ),
        )
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
                    AND_NODE(NUM_OF_BONUS_ON_UNIT_EXCLUDING_STAT_NODE,
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

// 聖日ティルフィング
{
    let skillId = getNormalSkillId(Weapon.HolytideTyrfing);
    // Enables【Canto (２)】.
    CAN_TRIGGER_CANTO_HOOKS.addSkill(skillId, () => TRUE_NODE);
    CALCULATES_DISTANCE_OF_CANTO_HOOKS.addSkill(skillId, () => new ConstantNumberNode(2));
    // Accelerates Special trigger (cooldown count-1).
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
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
            // unit’s HP > 1,
            // and foe would reduce unit’s HP to 0,
            // unit survives with 1 HP.
            // (Once per combat. Does not stack with non-Special effects that allow unit to survive with 1 HP if foe's attack would reduce HP to 0.)
            IF_NODE(IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE,
                new CanTargetActivateNonSpecialMiracleNode(0),
            )
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

// 鼓動の暗煙
{
    let skillId = PassiveC.PulseSmog;
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // Inflicts Spd/Def-3 on foe and
        new InflictsStatsMinusOnFoeDuringCombatNode(0, 3, 3, 0),
        // inflicts Special cooldown charge -1 on foe per attack during combat (only highest value applied; does not stack).
        INFLICTS_SPECIAL_COOLDOWN_CHARGE_MINUS_1_ON_FOE_NODE,
        // If unit initiates combat and foe's attack can trigger foe's Special,
        IF_NODE(AND_NODE(DOES_UNIT_INITIATE_COMBAT_NODE, CAN_FOES_ATTACK_TRIGGER_SPECIAL_NODE),
            // inflicts Special cooldown count+1 on foe before foe's first attack during combat
            INFLICTS_SPECIAL_COOLDOWN_COUNT_PLUS_N_ON_FOE_BEFORE_FOES_FIRST_ATTACK(1),
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
    UNIT_CAN_MOVE_TO_A_SPACE_HOOKS.addSkill(skillId, () => new ForSpacesNode(
        // Unit can move to a space within 2 spaces of any ally that has entered combat during the current turn.
        new ForEachAllyForSpacesNode(new HasTargetEnteredCombatDuringTheCurrentTurnNode,
            new ForSpacesWithinNSpacesNode(2),
        ),
        // Unit can move to a space within 2 spaces of any ally within 2 spaces.
        new ForEachAllyForSpacesNode(IS_TARGET_WITHIN_2_SPACES_OF_SKILL_OWNER_NODE,
            new ForSpacesWithinNSpacesNode(2),
        ),
    ));

    UNIT_CAN_MOVE_THROUGH_FOES_SPACES_HOOKS.addSkill(skillId, () => OR_NODE(
        // If ally has entered combat during the current turn,
        // unit can move through foes' spaces.
        new IsThereUnitOnMapNode(AND_NODE(
            ARE_TARGET_AND_SKILL_OWNER_IN_SAME_GROUP_NODE,
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
    WHEN_INFLICTS_STATS_MINUS_TO_FOES_HOOKS.addSkill(skillId, () => new SkillEffectNode(
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
    AT_TRANSFORMATION_PHASE_HOOKS.addSkill(skillId, () => new TraceBoolNode(TRUE_NODE));
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
        IF_NODE(IF_PENALTY_IS_ACTIVE_ON_FOE_NODE,
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
            FOR_EACH_CLOSEST_FOE_AND_ANY_FOE_WITHIN2_SPACES_OF_THOSE_FOES_NODE(
                // inflicts【Hush Spectrum】and【Panic】
                new InflictsStatusEffectsAtStartOfTurnNode(StatusEffectType.HushSpectrum, StatusEffectType.Panic),
            ),
        )
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // At start of combat, if unit's HP ≥ 25%,
        IF_NODE(IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE,
            new InflictsStatsMinusOnFoeDuringCombatNode(5, 5, 0, 0),
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
    AFTER_RALLY_SKILL_IS_USED_BY_UNIT_HOOK.addSkill(skillId, nodeFuncForAssist);
    AFTER_MOVEMENT_SKILL_IS_USED_BY_UNIT_HOOK.addSkill(skillId, nodeFuncForAssist);

    // After unit acts (if Canto triggers, after Canto),
    // or at start of enemy phase when defending in Aether Raids,
    // if there is no【Divine Vein (Ice)】 currently applied by unit or allies,
    // applies 【Divine Vein (Ice)】to spaces 2 spaces away from unit for 1 turn
    // (excludes spaces occupied by a foe, destructible terrain, and warp spaces in Rival Domains).
    AFTER_UNIT_ACTS_IF_CANTO_TRIGGERS_AFTER_CANTO_HOOKS.addSkill(skillId, nodeFunc);
    AT_START_OF_ENEMY_PHASE_HOOK.addSkill(skillId, () => new SkillEffectNode(
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
            FOR_EACH_CLOSEST_FOE_AND_ANY_FOE_WITHIN2_SPACES_OF_THOSE_FOES_NODE(
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
                IF_UNITS_OR_FOES_SPECIAL_IS_READY_OR_UNITS_OR_FOES_SPECIAL_TRIGGERED_BEFORE_OR_DURING_COMBAT_NODE,
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
        TARGET_ATTACKS_TWICE_NODE,
        TARGET_ATTACKS_TWICE_EVEN_IF_TARGETS_FOE_INITIATES_COMBAT_NODE,
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
                    OR_NODE(CAN_TARGET_CAN_MAKE_FOLLOW_UP_INCLUDING_POTENT_NODE, IF_TARGET_TRIGGERS_ATTACKS_TWICE_NODE),
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
                    OR_NODE(CAN_TARGET_CAN_MAKE_FOLLOW_UP_INCLUDING_POTENT_NODE, IF_TARGET_TRIGGERS_ATTACKS_TWICE_NODE),
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
        new ReducesDamageDuringCombatByPercentageNBySpecialPerAttackNode(
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
                    new IsStatusEffectActiveOnUnitNode(StatusEffectType.DeepStar)),
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
        new AppliesPotentEffectNode(1, -10)
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
    // TODO: indexを直接書かないで良いように依存関係を修正する
    WHEN_TRIGGERS_DUO_OR_HARMONIZED_EFFECT_HOOKS_MAP.addValue(1157,
        new SkillEffectNode(
            new ForEachUnitFromSameTitlesNode(
                new GrantsStatsNode(6, 6, 0, 0),
                new GrantsStatusEffectsNode(
                    StatusEffectType.ResonantBlades,
                    StatusEffectType.MobilityIncreased,
                ),
                NEUTRALIZES_ANY_PENALTY_ON_UNIT_NODE,
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
                    new UnitAppliesSkillEffectsPerAttack(
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
                new UnitAppliesSkillEffectsPerAttack(
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
    PRE_COMBAT_HOOKS.addSkill(skillId, () =>
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
                    new IncreasesSpdDiffNecessaryForFoesFollowUpNode(20),
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
                    new InflictsSpecialCooldownCountPlusNOnTargetsFoeBeforeTargetsFoesFirstAttack(1),
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
    WHEN_INFLICTS_STATS_MINUS_TO_FOES_HOOKS.addSkill(skillId, () => new SkillEffectNode(
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
            FOR_EACH_CLOSEST_FOE_AND_ANY_FOE_WITHIN2_SPACES_OF_THOSE_FOES_NODE(
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

