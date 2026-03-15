// スキル実装

// Heroic Maltet
{
    const skillId = Weapon.HeroicMaltet;
    // Accelerates Special trigger (cooldown count-1).
    // Reduces damage from area-of-effect Specials by 80% (excluding Røkkr area-of-effect Specials).
    BEFORE_AOE_SPECIAL_HOOKS.addSkill(skillId, NODE_FUNC(
        REDUCES_DAMAGE_FROM_AOE_SPECIALS_BY_X_PERCENT_NODE(80),
    ));
    // For foes within 3 rows or 3 columns centered on unit,
    SkillEffectRegistrar.registerSkillsForFoesDuringCombat(skillId,
        IS_TARGET_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_SKILL_OWNER_NODE,
        UNIT.doEffects(
            // inflicts Atk/Spd/Def/Res-5 on foe,
            INFLICTS_PENALTY(ATK_SPD_DEF_RES(5)).on(FOE),
            // inflicts Special cooldown charge -1 on foe per attack (only highest value applied; does not stack),
            INFLICTS_SPECIAL_COOLDOWN_CHARGE_MINUS_N_ON_FOE(1).perAttack().onlyHighestNotStack(),
            // neutralizes effects that grant “Special cooldown charge +X” to foe, and
            NEUTRALIZES_EFFECTS_THAT_GRANT_SPECIAL_COOLDOWN_CHARGE_PLUS_X,
            // reduces the percentage of foe’s non-Special “reduce damage by X%” skills by 50% during combat (excluding area-of-effect Specials).
            REDUCES_PERCENTAGE_OF_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_N_PERCENT(50).excludingAoe(),
        ),
    );
    SkillEffectRegistrar.registerSkillsDuringCombat(skillId, TRUE_NODE,
        // Grants Atk/Spd/Def/Res+10 to unit,
        GRANTS_BONUS(ATK_SPD_DEF_RES(10)).to(UNIT),
        UNIT.doEffects(
            // unit deals +25 damage (excluding area-of-effect Specials),
            DEALS_DAMAGE(25).excludingAoe(),
            // reduces damage from foe’s attacks by 15 (including area-of-effect Specials; excluding Røkkr area-of-effect Specials),
            REDUCES_DAMAGE_FROM_FOES_ATTACKS_BY(15).includingAoe(),
            // reduces damage from foe’s Specials by an additional 15 (including area-of-effect Specials; excluding Røkkr area-of-effect Specials), and
            REDUCES_DAMAGE_FROM_FOES_SPECIALS_BY(15).includingAoe(),
            // grants Special cooldown count-2 to unit before unit’s first follow-up attack during combat.
            GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_X_BEFORE_UNITS_FIRST_FOLLOW_UP_ATTACK(2).duringCombat(),
        ),
    );
}

// Armored Flare
{
    const skillId = Special.ArmoredFlare;
    // @2
    // When Special triggers, boosts damage by unit’s Def.
    // Reduces damage from foe’s attacks by 40% during combat (twice per combat; excluding area-of-effect Specials).
    // At start of turn, grants Atk/Def【Great Talent】+2 to unit.
    // After combat, if unit’s Special triggered, grants Atk/Def【Great Talent】+4 to unit.
    // (This skill grants max of【Great Talent】+10.)
    setSpecialCountAndType(skillId, 2, false, true, false, false);
    // When Special triggers, boosts damage by unit’s Def.
    WHEN_APPLIES_SPECIAL_EFFECTS_AT_START_OF_COMBAT_HOOKS.addSkill(skillId, NODE_FUNC(
        BOOSTS_DAMAGE_WHEN_SPECIAL_TRIGGERS_NODE(UNITS_DEF_NODE),
    ));
    // Reduces damage from foe’s attacks by 40% during combat (twice per combat; excluding area-of-effect Specials).
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, NODE_FUNC(
        REDUCES_DAMAGE_FROM_TARGETS_FOES_ATTACKS_BY_X_PERCENT_BY_SPECIAL_NODE(40),
        ANY_TARGETS_REDUCE_DAMAGE_EFFECT_ONLY_ONCE_CAN_BE_TRIGGERED_UP_TO_N_TIMES_PER_COMBAT_NODE(2),
    ));
    // At start of turn, grants Atk/Def【Great Talent】+2 to unit.
    AT_START_OF_TURN_HOOKS.addSkill(skillId, NODE_FUNC(
        GRANTS_GREAT_TALENTS_PLUS_TO_TARGET_NODE(ATK_DEF(2), ATK_DEF(10)),
    ));
    // After combat, if unit’s Special triggered, grants Atk/Def【Great Talent】+4 to unit.
    // (This skill grants max of【Great Talent】+10.)
    AFTER_COMBAT_HOOKS.addSkill(skillId, NODE_FUNC(
        IF_NODE(IS_TARGETS_SPECIAL_TRIGGERED_NODE,
            GRANTS_GREAT_TALENTS_PLUS_TO_TARGET_NODE(ATK_DEF(4), ATK_DEF(10)),
        ),
    ));
}

// Ostian Backbone
{
    const skillId = PassiveA.OstianBackbone;
    // Grants HP+5, Atk/Spd/Def/Res+9. Unit can counterattack regardless of foe’s range.
    // TODO: HP+5はパッシブステータスのため、スキル定義側で設定が必要

    // For unit and allies within 3 spaces of unit,
    // neutralizes effects that prevent unit’s or ally’s counterattacks during combat, and
    // if foe initiates combat, unit and allies can make a follow-up attack before foe’s next attack during combat.
    SkillEffectRegistrar.registerSkillsForAlliesDuringCombat(skillId,
        IS_TARGET_WITHIN_3_SPACES_OF_SKILL_OWNER_NODE,
        ALLY.do(DISABLES_SKILLS_THAT_PREVENT_COUNTERATTACKS()),
        IF(FOE.check(INITIATED_COMBAT),
            ALLY.can(MAKE_FOLLOW_UP_ATTACK_BEFORE_FOES_NEXT_ATTACK),
        ),
    );
    SkillEffectRegistrar.registerSkillsDuringCombat(skillId, TRUE_NODE,
        // neutralizes effects that prevent unit’s or ally’s counterattacks during combat, and
        UNIT.do(DISABLES_SKILLS_THAT_PREVENT_COUNTERATTACKS()),
        // if foe initiates combat, unit and allies can make a follow-up attack before foe’s next attack during combat.
        IF(FOE.check(INITIATED_COMBAT),
            UNIT.can(MAKE_FOLLOW_UP_ATTACK_BEFORE_FOES_NEXT_ATTACK),
        ),
        UNIT.doEffects(
            // Unit deals +7 damage (excluding area-of-effect Specials),
            DEALS_DAMAGE(7).excludingAoe(),
            // reduces damage from foe’s attacks by 7 (excluding area-of-effect Specials),
            REDUCES_DAMAGE_FROM_FOES_ATTACKS_BY(7).excludingAoe(),
            // neutralizes effects that inflict “Special cooldown charge -X” on unit, and
            NEUTRALIZES_EFFECTS_THAT_INFLICT_SPECIAL_COOLDOWN_CHARGE_MINUS_X.on(UNIT),
        ),
        // neutralizes effects that allow foe to make a follow-up attack before unit’s next attack during combat.
        UNIT.do(DISABLES_SKILLS_THAT_CHANGE_ATTACK_PRIORITY()),
    );
}

// Harmonized Skill (Resonance: Shields)
{
    // 比翼総選挙ヘクトル
    const skillId = getDuoOrHarmonizedSkillId(Hero.DuoBraveHector);
    let alliesNode =
        CACHE_NODE(`${skillId}_同じ出典の最もHPが高い行動済みの味方`,
            MAX_UNITS_NODE(
                FILTER_UNITS_NODE(SKILL_OWNERS_ALLIES_ON_MAP_NODE,
                    AND_NODE(
                        ARE_TARGET_AND_SKILL_OWNERS_HAS_SAME_TITLE_NODE,
                        IS_TARGET_ACTION_DONE_NODE,
                    ),
                ),
                TARGETS_HP_ON_MAP_NODE,
            ),
        );
    WHEN_TRIGGERS_DUO_OR_HARMONIZED_EFFECT_HOOKS.addSkill(skillId, NODE_FUNC(
        FOR_EACH_UNIT_FROM_SAME_TITLES_NODE(
            // Grants【Resonance: Shields】to unit and allies from the same titles as unit.
            GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.ResonantShield),
        ),
        // Grants another action to certain target,
        // and if Canto has already been triggered, re-enables Canto
        // (if there are allies from the same titles as unit on the map
        // who have already acted, targets ally with the highest HP among those allies;
        // otherwise, targets unit;
        // if multiple targets meet the conditions, effect will not trigger).
        IF_NODE(EQ_NODE(COUNT_UNITS_NODE(alliesNode), 0),
            FOR_SKILL_OWNER_NODE(GRANTS_ANOTHER_ACTION_TO_TARGET_ON_MAP_NODE),
            FOR_SKILL_OWNER_NODE(RE_ENABLES_CANTO_TO_TARGET_ON_MAP_NODE),
        ),
        IF_NODE(EQ_NODE(COUNT_UNITS_NODE(alliesNode), 1),
            FOR_EACH_UNIT_NODE(alliesNode,
                GRANTS_ANOTHER_ACTION_TO_TARGET_ON_MAP_NODE,
                RE_ENABLES_CANTO_TO_TARGET_ON_MAP_NODE,
            ),
        ),
    ));
}

// Sisters’ Blade
{
    const skillId = Weapon.SistersBlade;
    // Accelerates Special trigger (cooldown count-1).
    // For unit and allies within 3 rows or 3 columns centered on unit,
    let getSkills = unitNode => makeArray(
        // grants Atk/Spd/Def/Res+X (for unit, X = 15; for allies, X = 5),
        unitNode.do(GRANTS_BONUS(ATK_SPD_DEF_RES(X)).duringCombat().x(unitNode === UNIT ? 15 : 5)),
        // neutralizes effects that grant “Special cooldown charge +X” to foe or
        NEUTRALIZES_EFFECTS_THAT_GRANT_SPECIAL_COOLDOWN_CHARGE_PLUS_X.to(unitNode),
        // inflict “Special cooldown charge -X” on unit or ally, and
        NEUTRALIZES_EFFECTS_THAT_INFLICT_SPECIAL_COOLDOWN_CHARGE_MINUS_X.on(unitNode),
        // grants Special cooldown charge +1 to unit or ally per attack during combat (only highest value applied; does not stack).
        GRANTS_SPECIAL_COOLDOWN_CHARGE_PLUS_N(1).to(unitNode).perAttack().duringCombat().onlyHighestNotStack(),
    );
    SkillEffectRegistrar.registerSkillsDuringCombat(skillId, TRUE_NODE,
        ...getSkills(UNIT),
    );
    SkillEffectRegistrar.registerSkillsForAlliesDuringCombat(skillId,
        IS_ALLY_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_UNIT_NODE,
        ...getSkills(ALLY),
    );
    SkillEffectRegistrar.registerSkillsDuringCombat(skillId, TRUE_NODE,
        UNIT.doEffects(
            // Unit deals +25 damage (excluding area-of-effect Specials),
            DEALS_DAMAGE(25).excludingAoe(),
            // reduces damage from foe’s attacks by 15 (excluding area-of-effect Specials), and
            REDUCES_DAMAGE_FROM_FOES_ATTACKS_BY(15).excludingAoe(),
            // reduces damage from foe’s Specials by an additional 15 (excluding area-of-effect Specials) during combat, and
            REDUCES_DAMAGE_FROM_FOES_SPECIALS_BY(15).excludingAoe(),
        ),
        // restores 7 HP to unit after combat.
        RESTORES_HP_AFTER_COMBAT(7).to(UNIT),
    );
    // Unit can use the following【Style】: Scendscale Style
    setUnitCanUseFollowingStyle(skillId, StyleType.SCENDSCALE);
}

// Swift Specter
{
    const skillId = PassiveA.SwiftSpecter;
    // Enables【Canto (Dist. +1; Max 4)】.
    enablesCantoDist(skillId, 1, 4);
    SkillEffectRegistrar.registerSkillsDuringCombat(skillId,
        // At start of combat, if unit’s HP ≥ 25% or if unit is within 3 spaces of an ally,
        IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE.or(IS_TARGET_WITHIN_3_SPACES_OF_TARGETS_ALLY_NODE),
        // grants Atk/Spd+9 to unit and
        GRANTS_BONUS(ATK_SPD(9)).to(UNIT),
        // deals +7 damage during combat (excluding area-of-effect Specials), and also,
        UNIT.do(DEALS_DAMAGE(7).excludingAoe()),
        // if unit’s Spd > foe’s Spd,
        IF(UNIT.spd.sgt(FOE.spd),
            UNIT.doEffects(
                // neutralizes effects that guarantee foe’s follow-up attacks and
                NEUTRALIZES_EFFECTS_THAT_GUARANTEE_FOES_FOLLOW_UP_ATTACKS(true),
                // effects that prevent unit’s follow-up attacks during combat.
                NEUTRALIZES_EFFECTS_THAT_PREVENT_UNITS_FOLLOW_UP_ATTACKS(true),
            ).duringCombat(),
        ),
    );
    SkillEffectRegistrar.registerSkillsDuringCombat(skillId,
        // At start of combat, if unit’s HP ≥ 25% and unit is within 3 spaces of an ally,
        AND_NODE(IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE, IS_TARGET_WITHIN_3_SPACES_OF_TARGETS_ALLY_NODE),
        // grants an additional Atk/Spd+3 to unit during combat.
        GRANTS_BONUS(ATK_SPD(3)).to(UNIT),
    );
}

// Wild at Heart
{
    const skillId = PassiveB.WildAtHeart;
    SkillEffectRegistrar.registerSkillsDuringCombat(skillId, TRUE_NODE,
        // Unit attacks twice (even if foe initiates combat, unit attacks twice).
        UNIT.do(ATTACKS_TWICE).duringCombat(),
    );
    // At start of turn, and after unit acts (if Canto triggers, after Canto),
    setAtStartOfTurnAndAfterUnitActsIfCantoAfterCanto(skillId, NODE_FUNC(
        EFFECTS(
            // inflicts Spd/Def-7,
            INFLICTS_PENALTY(SPD_DEF(7)),
            //【Exposure】, and【Sabotage】
            INFLICTS_STATUS_EFFECTS(StatusEffectType.Exposure),
            INFLICTS_STATUS_EFFECTS(StatusEffectType.Sabotage),
            // on closest foes and any foe within 2 spaces of those foes through their next actions.
        ).on(CLOSEST_FOES.and(FOES_WITHIN.spaces(2).of(CLOSEST_FOES))).throughTheirNextActions(),
    ));
    SkillEffectRegistrar.registerSkillsDuringCombat(skillId, TRUE_NODE,
        // Inflicts Atk/Spd/Def-5 on foe,
        INFLICTS_PENALTY(ATK_SPD_DEF(5)).on(FOE),
        // unit deals damage = 20% of unit’s Spd (excluding area-of-effect Specials), and
        DEALS_DAMAGE_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS(20, UNITS_SPD_DURING_COMBAT_NODE),
        // reduces damage from foe’s attacks by 20% of unit’s Spd (excluding area-of-effect Specials) during combat.
        REDUCES_DAMAGE_FROM_TARGETS_FOES_ATTACKS_BY_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS_NODE(20, UNITS_SPD_DURING_COMBAT_NODE),
        // If unit’s HP > 1 and foe would reduce unit’s HP to 0 during combat,
        // unit survives with 1 HP (once per combat;
        // does not stack with non-Special effects that allow unit to survive with 1 HP if foe’s attack would reduce HP to 0).
        UNIT.can(CAN_ACTIVATE_NON_SPECIAL_MIRACLE()),
    );
}

// Scendscale Style
{
    const style = StyleType.SCENDSCALE;
    const skillId = getStyleSkillId(style);
    CAN_ACTIVATE_STYLE_HOOKS.addSkill(skillId, () => TRUE_NODE);
    // Unit can attack foes 3 spaces away (unit cannot attack adjacent foes).
    CAN_ATTACK_FOES_N_SPACES_AWAY_DURING_STYLE_HOOKS.addSkill(skillId, () =>
        CONSTANT_NUMBER_NODE(3));
    SkillEffectRegistrar.registerSkillsDuringCombat(skillId, IS_STYLE_ACTIVE(style),
        // Unit deals +10 damage during combat (excluding area-of-effect Specials).
        UNIT.do(DEALS_DAMAGE(10).excludingAoe()),
    );
    // Cannot move through spaces within 3 spaces of foe that has triggered the Bulwark effect (does not apply if unit has a Pass skill).
    CANNOT_UNIT_MOVE_THROUGH_SPACES_WITHIN_3_SPACES_OF_FOE_HOOKS.addSkill(skillId, () =>
        AND_NODE(
            IS_STYLE_ACTIVE(style),
            FOR_TARGET_NODE(TARGETS_FOE_NODE, TARGET_HAS_TRIGGERED_THE_BULWARK_EFFECT_NODE),
        ),
    );
    // Unit suffers a counterattack if any of the following conditions are met:
    SUFFERS_COUNTERATTACK_DURING_STYLE_HOOKS.addSkill(skillId, () =>
        OR_NODE(
            // foe is armored with Range = 1, or
            AND_NODE(IS_FOE_ARMOR_NODE, FOES_RANGE_IS_1_NODE),
            // foe can counterattack regardless of unit's range.
            CAN_FOE_COUNTERATTACK_REGARDLESS_OF_RANGE_NODE,
        ),
    );
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, NODE_FUNC(
        IF_NODE(IS_STYLE_ACTIVE(style),
            // After-combat movement effects do not occur.
            AFTER_COMBAT_MOVEMENT_EFFECTS_DO_NOT_OCCUR_BECAUSE_OF_TARGET_NODE,
        ),
    ));
    // Skill effect's Range is treated as 1.
    STYLES_THAT_SKILLS_EFFECTS_RANGE_IS_TREATED_AS_1.add(style);
    // Once used, this Style cannot be used for two turns.
    setOnceUsedThisStyleCannotBeUsedForNTurns(skillId, 2);
}

// Harmonized Skill (Resonance: Blades)
{
    // 比翼総選挙セリカ
    const skillId = getDuoOrHarmonizedSkillId(Hero.DuoBraveCelica);
    let alliesNode =
        CACHE_NODE(`${skillId}_同じ出典の最もHPが高い行動済みの味方`,
            MAX_UNITS_NODE(
                FILTER_UNITS_NODE(SKILL_OWNERS_ALLIES_ON_MAP_NODE,
                    AND_NODE(
                        ARE_TARGET_AND_SKILL_OWNERS_HAS_SAME_TITLE_NODE,
                        IS_TARGET_ACTION_DONE_NODE,
                    ),
                ),
                TARGETS_HP_ON_MAP_NODE,
            ),
        );
    WHEN_TRIGGERS_DUO_OR_HARMONIZED_EFFECT_HOOKS.addSkill(skillId, NODE_FUNC(
        FOR_EACH_UNIT_FROM_SAME_TITLES_NODE(
            // Grants【Resonance: Blades】to unit and allies from the same titles as unit.
            GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.ResonantBlades),
        ),
        // Grants another action to a certain target,
        // and if Canto has already been triggered, re-enables Canto
        // (if there are allies from the same titles as unit on the map
        // who have already acted, targets ally with the highest HP among those allies;
        // otherwise, targets unit;
        // if multiple targets meet the conditions, effect will not trigger).
        IF_NODE(EQ_NODE(COUNT_UNITS_NODE(alliesNode), 0),
            FOR_SKILL_OWNER_NODE(GRANTS_ANOTHER_ACTION_TO_TARGET_ON_MAP_NODE),
            FOR_SKILL_OWNER_NODE(RE_ENABLES_CANTO_TO_TARGET_ON_MAP_NODE),
        ),
        IF_NODE(EQ_NODE(COUNT_UNITS_NODE(alliesNode), 1),
            FOR_EACH_UNIT_NODE(alliesNode,
                GRANTS_ANOTHER_ACTION_TO_TARGET_ON_MAP_NODE,
                RE_ENABLES_CANTO_TO_TARGET_ON_MAP_NODE,
            ),
        ),
    ));
}

// Chosen Lance
{
    const skillId = Weapon.ChosenLance;
    // Enables【Canto (Dist. +1; Max 4)】.
    enablesCantoDist(skillId, 1, 4);
    // Accelerates Special trigger (cooldown count-1).
    // Unit can counterattack regardless of foe’s range.
    // TODO: 武器の反撃不可無効はスキル定義側で設定が必要か確認
    // At start of player phase or enemy phase,
    setAtStartOfPlayerPhaseOrEnemyPhase(skillId, NODE_FUNC(
        // grants【Empathy】,【Dodge】, and【Null Follow-Up】to unit and allies within 2 spaces of unit for 1 turn.
        GRANTS_STATUS_EFFECTS(
            StatusEffectType.Empathy,
            StatusEffectType.Dodge,
            StatusEffectType.NullFollowUp,
        ).to(UNIT.and(ALLIES_WITHIN.spaces(2).of(UNIT))).forNTurn(1),
    ));
    SkillEffectRegistrar.registerSkillsDuringCombat(skillId, TRUE_NODE,
        // Grants Atk/Spd/Def/Res+15 to unit,
        GRANTS_BONUS(ATK_SPD_DEF_RES(15)).to(UNIT),
        UNIT.doEffects(
            // unit deals +25 damage (excluding area-of-effect Specials),
            DEALS_DAMAGE(25).excludingAoe(),
            // reduces damage from foe’s attacks by 15 (excluding area-of-effect Specials), and
            REDUCES_DAMAGE_FROM_FOES_ATTACKS_BY(15).excludingAoe(),
            // reduces damage from foe’s Specials by an additional 15 (excluding area-of-effect Specials) during combat.
            REDUCES_DAMAGE_FROM_FOES_SPECIALS_BY(15).excludingAoe(),
        ),
    );
    // Unit can use the following【Style】: Chosen Lance Style
    setUnitCanUseFollowingStyle(skillId, StyleType.CHOSEN_LANCE);
}

// Frozen Mirror
{
    const skillId = Special.FrozenMirror;
    // @3
    // Boosts damage by 60% of unit’s Spd when Special triggers.
    // Reduces damage from foe’s attacks by 40% (excluding area-of-effect Specials),
    // and unit’s next attack deals damage = total damage reduced from foe’s first attack
    // during combat (by any source, including other skills; resets at end of combat).
    // At start of enemy phase (except for in Pawns of Loki),
    // if there is no【Divine Vein (Icicle)】currently applied by unit or allies,
    // applies【Divine Vein (Icicle)】to spaces 2 spaces away from unit for 1 turn
    // (excluding spaces occupied by a foe, destructible terrain other than Divine Vein,
    // or warp spaces in Rival Domains),
    // and【Divine Vein (Vert)】to unit’s space and spaces within 3 spaces of unit
    // for 1 turn (excluding spaces with【Divine Vein (Icicle)】applied).
    setSpecialCountAndType(skillId, 3, false, true, false, false);
    // Boosts damage by 60% of unit’s Spd when Special triggers.
    WHEN_APPLIES_SPECIAL_EFFECTS_AT_START_OF_COMBAT_HOOKS.addSkill(skillId, NODE_FUNC(
        BOOSTS_DAMAGE_WHEN_SPECIAL_TRIGGERS_NODE(MULT_TRUNC_NODE(0.6, UNITS_SPD_DURING_COMBAT_NODE)),
    ));
    // Reduces damage from foe’s attacks by 40% (excluding area-of-effect Specials),
    // and unit’s next attack deals damage = total damage reduced from foe’s first attack
    // during combat (by any source, including other skills; resets at end of combat).
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, NODE_FUNC(
        REDUCES_DAMAGE_FROM_TARGETS_FOES_ATTACKS_BY_X_PERCENT_BY_SPECIAL_NODE(40),
        TARGETS_NEXT_ATTACK_DEALS_DAMAGE_EQ_TOTAL_DAMAGE_REDUCED_FROM_TARGETS_FOES_FIRST_ATTACK_NODE,
    ));
    // At start of enemy phase (except for in Pawns of Loki),
    let icicleSpacesCacheNode =
        CACHE_NODE(`${skillId}_icicle-spaces`,
            FILTER_SPACES_NODE(
                // spaces 2 spaces away from unit
                SPACES_N_SPACES_AWAY_FROM_TARGET_NODE(2),
                NOT_NODE(
                    OR_NODE(
                        // excluding spaces occupied by a foe,
                        IS_SPACE_OCCUPIED_BY_TARGETS_FOE_NODE,
                        // destructible terrain other than Divine Vein,
                        // or warp spaces in Rival Domains
                        IS_TARGETS_DESTRUCTIBLE_TERRAIN_OTHER_THAN_DIVINE_VEIN_NODE,
                    ),
                ),
            ),
        );
    setAtStartOfEnemyPhaseExceptForInPawnsOfLoki(skillId, NODE_FUNC(
        // if there is no【Divine Vein (Icicle)】currently applied by unit or allies,
        IF_NODE(IS_THERE_NO_DIVINE_VEIN_CURRENTLY_APPLIED_BY_TARGET_OR_TARGETS_ALLIES_NODE(DivineVeinType.Icicle),
            // applies【Divine Vein (Icicle)】to spaces 2 spaces away from unit for 1 turn
            FOR_EACH_SPACES_NODE(
                icicleSpacesCacheNode,
                APPLY_DIVINE_VEIN_NODE(DivineVeinType.Icicle, TARGET_GROUP_NODE, 1),
            ),
            // and【Divine Vein (Vert)】to unit’s space and spaces within 3 spaces of unit
            // for 1 turn (excluding spaces with【Divine Vein (Icicle)】applied).
            FOR_EACH_SPACES_NODE(
                DIFFERENCE_SPACES_NODE(
                    FLAT_MAP_UNITS_NODE(
                        UnitsNode.makeFromUnit(TARGET_NODE),
                        SPACES_WITHIN_N_SPACES_OF_TARGET_NODE(3),
                    ),
                    icicleSpacesCacheNode,
                ),
                APPLY_DIVINE_VEIN_NODE(DivineVeinType.Vert, TARGET_GROUP_NODE, 1),
            ),
        ),
    ));
}

// Spd/Res Faith
{
    const skillId = PassiveC.SpdResFaith;
    // At start of player phase or enemy phase,
    setAtStartOfPlayerPhaseOrEnemyPhase(skillId, () => SKILL_EFFECT_NODE(
        // if unit is within 2 spaces of an ally,
        IF_NODE(IS_TARGET_WITHIN_2_SPACES_OF_TARGETS_ALLY_NODE,
            // grants Spd/Res+6 and【Bulwark】to unit for 1 turn.
            new GrantsStatsPlusToTargetOnMapNode(0, 6, 0, 6),
            GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.Bulwark),
        ),
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // If【Bulwark】is active on unit,
        IF_NODE(IS_STATUS_EFFECT_ACTIVE_ON_TARGET_NODE(StatusEffectType.Bulwark),
            // grants Spd/Res+4 to unit,
            GRANTS_SPD_RES_TO_TARGET_DURING_COMBAT_NODE(4),
            // reduces damage from foe’s first attack by 5
            // (“first attack” normally means only the first strike;
            // for effects that grant “unit attacks twice,” it means the first and second strikes),
            REDUCES_DAMAGE_FROM_FOES_FIRST_ATTACK_BY_N_DURING_COMBAT_INCLUDING_TWICE_NODE(5),
            // and grants Special cooldown count-1 to unit before foe’s first attack during combat.
            GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_N_TO_TARGET_BEFORE_TARGETS_FOES_FIRST_ATTACK_DURING_COMBAT_NODE(1),
        ),
    ));
}

// Chosen Lance Style
{
    const style = StyleType.CHOSEN_LANCE;
    const skillId = getStyleSkillId(style);
    CAN_ACTIVATE_STYLE_HOOKS.addSkill(skillId, () => TRUE_NODE);
    // Unit can attack foes 2 spaces away (unit cannot attack adjacent foes).
    CAN_ATTACK_FOES_N_SPACES_AWAY_DURING_STYLE_HOOKS.addSkill(skillId, () =>
        CONSTANT_NUMBER_NODE(2));
    // Decreases Spd difference necessary for unit to make a follow-up attack by 10 during combat.
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, NODE_FUNC(
        IF_NODE(IS_STYLE_ACTIVE(style),
            DECREASES_SPD_DIFF_NECESSARY_FOR_UNIT_TO_MAKE_FOLLOW_UP_NODE(10),
        ),
    ));
    // Cannot move through spaces within 2 spaces of foe that has triggered the Bulwark effect (does not apply if unit has a Pass skill).
    CANNOT_UNIT_MOVE_THROUGH_SPACES_WITHIN_2_SPACES_OF_FOE_HOOKS.addSkill(skillId, () =>
        AND_NODE(
            IS_STYLE_ACTIVE(style),
            FOR_TARGET_NODE(TARGETS_FOE_NODE, TARGET_HAS_TRIGGERED_THE_BULWARK_EFFECT_NODE),
        ),
    );
    // Unit suffers a counterattack if any of the following conditions are met:
    SUFFERS_COUNTERATTACK_DURING_STYLE_HOOKS.addSkill(skillId, () =>
        OR_NODE(
            // foe is armored with Range = 1,
            AND_NODE(IS_FOE_ARMOR_NODE, FOES_RANGE_IS_1_NODE),
            // foe can counterattack regardless of unit's range, or
            CAN_FOE_COUNTERATTACK_REGARDLESS_OF_RANGE_NODE,
            // foe's Range is the same as the distance between unit and foe.
            EQ_NODE(FOES_RANGE_NODE, DISTANCE_BETWEEN_TARGET_AND_TARGETS_FOE_NODE),
        ),
    );
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, NODE_FUNC(
        IF_NODE(IS_STYLE_ACTIVE(style),
            // After-combat movement effects do not occur.
            AFTER_COMBAT_MOVEMENT_EFFECTS_DO_NOT_OCCUR_BECAUSE_OF_TARGET_NODE,
        ),
    ));
    // Skill effect's Range is treated as 1.
    STYLES_THAT_SKILLS_EFFECTS_RANGE_IS_TREATED_AS_1.add(style);
    // This Style can be used only once per turn.
    STYLES_THAT_CAN_BE_USED_ONLY_ONCE_PER_TURN.add(style);
}

// Gift of Love
{
    const skillId = Weapon.GiftOfLove;
    // Mt: 14 Rng:2
    // Enables (Canto (Dist.; Max 3, Min 1)) .
    enablesCantoDistMin(skillId, 0, 3, 1);
    // Accelerates Special trigger (cooldown count-1).
    // If a skill compares unit's Res to a foe's or ally's Res, treats unit's Res as if granted +5.
    AT_COMPARING_STATS_HOOKS.addSkill(skillId, () => RES(5));
    // After start-of-turn effects trigger on player phase, and after start-of-turn effects trigger on enemy phase (except for in Summoner Duels),
    setAfterStartOfTurnEffectsTriggerOnPlayerOrEnemyPhaseExceptForInSummonerDuelsHooks(skillId, NODE_FUNC(
        // for unit and allies within 3 spaces of unit,
        UNIT.and(ALLIES_WITHIN.spaces(3).of(UNIT))
            // neutralizes stat penalties
            .do(NEUTRALIZES_STAT_PENALTIES())
            // and two Penalty effects
            // (does not apply to Penalty effects that are applied at the same time; neutralizes the first applicable Penalty effects on unit's or ally's list of active effects).
            .and(NEUTRALIZES_N_PENALTY_EFFECTS(2).firstApplicable()),
    ));
    let getSkills = unitNode => makeArray(
        // For unit and allies within 3 rows or 3 columns centered on unit,
        // grants Atk/Spd/Def/Res+X during combat (for unit, X = 15; for allies, X = 5), and also,
        unitNode.do(GRANTS_BONUS(ATK_SPD_DEF_RES(X)).duringCombat().x(unitNode === UNIT ? 15 : 5)),
        // if unit's or ally's Spd > foe's Spd,
        IF(unitNode.spd.sgt(FOE.spd),
            unitNode.doEffects(
                // neutralizes effects that guarantee foe's follow-up attacks and
                NEUTRALIZES_EFFECTS_THAT_GUARANTEE_FOES_FOLLOW_UP_ATTACKS(true),
                // effects that prevent unit's or ally's follow-up attacks
                NEUTRALIZES_EFFECTS_THAT_PREVENT_UNITS_FOLLOW_UP_ATTACKS(true)
                // during combat.
            ).duringCombat(),
        ),
    );
    SkillEffectRegistrar.registerSkillsDuringCombat(skillId, TRUE_NODE,
        ...getSkills(UNIT),
    );
    SkillEffectRegistrar.registerSkillsForAlliesDuringCombat(skillId,
        IS_ALLY_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_UNIT_NODE,
        ...getSkills(ALLY),
    );

    SkillEffectRegistrar.registerSkillsDuringCombat(skillId, TRUE_NODE,
        // Unit deals +25 damage during combat (excluding area-of-effect Specials).
        UNIT.do(DEALS_DAMAGE(25).duringCombat().excludingAoe()),
        // If decreasing the Spd difference necessary to make a follow-up attack by 10 would allow unit to trigger a follow-up attack (excluding guaranteed or prevented follow-ups),
        IF(UNIT.check(CAN_DECREASING_SPD_TRIGGER_FOLLOW_UP_EXCLUDING_GUARANTEED_OR_PREVENTED_FOLLOW_UPS(10)),
            // triggers (Potent Follow 100%] during combat.
            UNIT.do(TRIGGERS_POTENT_FOLLOW_N_PERCENT(100)).duringCombat(),
        ),
        // If unit initiates combat,
        IF(UNIT.check(INITIATED_COMBAT),
            // unit can make a follow-up attack before foe's next attack during combat.
            UNIT.can(MAKE_FOLLOW_UP_ATTACK_BEFORE_FOES_NEXT_ATTACK).duringCombat(),
        ),
    );
}

// S/R Detect Aerial + A/R Detect Aerial
{
    let setSkill = (skillId, statsMinusNode5, neutralizeBonusesFlags, statsMinusNode4) => {
        // For foes on the map whose Res < unit's Res at start of combat,
        let condNode = LT_NODE(TARGETS_EVAL_RES_NODE, SKILL_OWNERS_EVAL_RES_ON_MAP);
        FOR_FOES_INFLICTS_STATS_MINUS_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
            IF_NODE(condNode,
                // inflicts Spd/Res-5,
                statsMinusNode5,
            ),
        ));
        FOR_FOES_AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
            IF_NODE(condNode,
                // neutralizes foe's bonuses to Spd/Res, and
                new NeutralizesFoesBonusesToStatsDuringCombatNode(...neutralizeBonusesFlags),
                // foe suffers +10 damage during combat (excluding area-of-effect Specials).
                DEALS_DAMAGE_X_NODE(10),
            ),
        ));
        SkillEffectRegistrar.registerSkillsDuringCombat(skillId, TRUE_NODE,
            // Inflicts Spd/Res-4 on foe,
            statsMinusNode4,
            // and unit deals +8 damage during combat (excluding area-of-effect Specials).
            UNIT.do(DEALS_DAMAGE(8).excludingAoe()),
        );
    };
    // S/R Detect Aerial
    setSkill(PassiveB.SRDetectAerial,
        INFLICTS_SPD_RES_ON_FOE_DURING_COMBAT_NODE(5),
        [false, true, false, true],
        INFLICTS_PENALTY(SPD_RES(4)).on(FOE),
    );
    // A/R Detect Aerial
    setSkill(PassiveB.ARDetectAerial,
        INFLICTS_ATK_RES_ON_FOE_DURING_COMBAT_NODE(5),
        [true, false, false, true],
        INFLICTS_PENALTY(ATK_RES(4)).on(FOE),
    );
}

// Truly Inspired
{
    const skillId = PassiveC.TrulyInspired;
    // At start of player phase or enemy phase,
    setAtStartOfPlayerPhaseOrEnemyPhase(skillId, NODE_FUNC(
        // grants [Truly Incited] to unit for 1 turn, and also,
        GRANTS_STATUS_EFFECTS(StatusEffectType.TrulyIncited).to(UNIT).forNTurn(1),
        // if any foes within 3 rows or 3 columns centered on unit have Res < unit's Res+5,
        FOR_EACH_UNIT_NODE(
            FILTER_UNITS_NODE(
                TARGETS_FOES_ON_MAP_NODE,
                AND_NODE(
                    IS_TARGET_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_SKILL_OWNER_NODE,
                    LT_NODE(TARGETS_EVAL_RES_NODE, ADD_NODE(SKILL_OWNERS_EVAL_RES_ON_MAP, 5)),
                ),
            ),
            // inflicts [Ploy] and [Exposure] on those foes through their next actions.
            INFLICTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.Ploy, StatusEffectType.Exposure),
        ),
    ));
    SkillEffectRegistrar.registerSkillsDuringCombat(skillId, TRUE_NODE,
        // Grants Atk/Res+4 during combat.
        GRANTS_BONUS(ATK_RES(4)).to(UNIT),
    );
}

// Sweet Staff
{
    const skillId = Weapon.SweetStaff;
    // Mt: 14
    // Rng: 2
    // Calculates damage from staff like other weapons.
    // Accelerates Special trigger (cooldown count-1; max cooldown count value cannot be reduced below 1).
    // At start of player phase or enemy phase,
    setAtStartOfPlayerPhaseOrEnemyPhase(skillId, NODE_FUNC(
        // grants "neutralizes foe's bonuses during combat,"
        // "increases Spd difference necessary for foe to make a follow-up attack by 10 during combat,"
        // and [Canto (1)] to unit and allies within 2 spaces of unit for 1 turn.
        GRANTS_STATUS_EFFECTS(
            StatusEffectType.NeutralizesFoesBonusesDuringCombat,
            StatusEffectType.IncreasesSpdDifferenceNecessaryForFoeToMakeAFollowUpAttackBy10DuringCombat,
            StatusEffectType.Canto1,
        ).to(UNIT.and(ALLIES_WITHIN.spaces(2).of(UNIT))).forNTurn(1),
    ));
    SkillEffectRegistrar.registerSkillsDuringCombat(skillId, TRUE_NODE,
        // Grants Atk/Spd/Def/Res+15 to unit,
        GRANTS_BONUS(ATK_SPD_DEF_RES(15)).to(UNIT),
        UNIT.doEffects(
            // unit deals +25 damage (excluding area-of-effect Specials),
            DEALS_DAMAGE(25).excludingAoe(),
            // reduces damage from foe's attacks by 15 (excluding area-of-effect Specials),
            REDUCES_DAMAGE_FROM_FOES_ATTACKS_BY(15).excludingAoe(),
            // reduces damage from foe's Specials by an additional 15 (excluding area-of-effect Specials),
            REDUCES_DAMAGE_FROM_FOES_SPECIALS_BY(15).excludingAoe(),
        ),
        // restores 7 HP to unit when unit deals damage to foe, and
        WHEN_TARGET_DEALS_DAMAGE_DURING_COMBAT_RESTORES_N_HP_TO_TARGET_NODE(7),
        // grants Special cooldown count-2 to unit before foe's first attack during combat.
        GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_N_TO_TARGET_BEFORE_TARGETS_FOES_FIRST_ATTACK_DURING_COMBAT_NODE(2),
    );
}

// Guardian+
{
    const skillId = Support.GuardianPlus;
    // Rng: 2
    ASSIST_RANGE_MAP.set(skillId, 2);
    // This skill is treated as a Rally Assist skill.
    // Restores HP = 50% of unit's Atk (min 8 HP) to target ally, grants Spd/Def/Res+6 and [Fringe Bonus] to unit and target ally for 1 turn,
    // and also, when there is no ally on the map with [Physical Twin Save] (including unit and target ally),
    // grants [Physical Twin Save] to target ally for 1 turn.
    // (Using this skill has no effect on Special cooldown charge and unit does not gain EXP or SP.)
    setRallyHealSkill(skillId, [0, 6, 6, 6], 8, 0.5,
        [StatusEffectType.FringeBonus, StatusEffectType.PhysicalTwinSave]);

    AFTER_RALLY_SKILL_IS_USED_BY_UNIT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // grants Spd/Def/Res+6 and [Fringe Bonus] to unit for 1 turn
        new GrantsStatsPlusToTargetOnMapNode(0, 6, 6, 6),
        GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.FringeBonus),
        // grants [Fringe Bonus] to target ally for 1 turn
        FOR_TARGET_NODE(ASSIST_TARGET_NODE,
            GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.FringeBonus),
        ),
        // when there is no ally on the map with [Physical Twin Save] (including unit and target ally),
        // grants [Physical Twin Save] to target ally for 1 turn
        IF_NODE(
            EQ_NODE(0, COUNT_UNITS_NODE(
                FILTER_UNITS_NODE(SKILL_OWNER_AND_SKILL_OWNERS_ALLIES_ON_MAP_NODE,
                    IS_STATUS_EFFECT_ACTIVE_ON_TARGET_NODE(StatusEffectType.PhysicalTwinSave),
                ),
            )),
            FOR_TARGET_NODE(ASSIST_TARGET_NODE,
                GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.PhysicalTwinSave),
            ),
        ),
    ));
}

// [Physical Twin Save]
{
    let skillId = getStatusEffectSkillId(StatusEffectType.PhysicalTwinSave);
    // If a sword, lance, axe, bow, dagger, or beast foe initiates combat against an ally within 2 spaces of unit,
    // triggers Savior on unit (triggers only if unit is not equipped with a skill that can trigger another Savior effect;
    // if unit is granted multiple statuses that enable "Savior" effects to trigger, Savior will not trigger).
    CAN_TRIGGER_SAVIOR_HOOKS.addSkill(skillId, () =>
        AND_NODE(
            IS_TARGET_WITHIN_2_SPACES_OF_SKILL_OWNER_NODE,
            FOR_FOE_NODE(IS_TARGET_P_WEAPON_NODE),
        ),
    );
    setCondHooks(skillId,
        // If foe uses sword, lance, axe, bow, dagger, or beast damage,
        FOR_FOE_NODE(IS_TARGET_P_WEAPON_NODE),
        [
            AT_START_OF_COMBAT_HOOKS,
            NODE_FUNC(
                // disables foe's effects that "calculate damage using the lower of foe's Def or Res"
                // (including area-of-effect Specials),
                DISABLES_TARGETS_FOES_SKILLS_THAT_CALCULATE_DAMAGE_USING_THE_LOWER_OF_TARGETS_FOES_DEF_OR_RES_DURING_COMBAT_NODE,
                // and any "reduces damage by X%" effect that can be triggered only once per combat by unit's equipped Special skill
                // can be triggered up to twice per combat during combat
                // (excludes boosted Special effects from engaging; only highest value applied; does not stack).
                ANY_TARGETS_REDUCE_DAMAGE_EFFECT_ONLY_ONCE_CAN_BE_TRIGGERED_UP_TO_N_TIMES_PER_COMBAT_NODE(2),
            ),
        ],
        [
            BEFORE_AOE_SPECIAL_HOOKS,
            NODE_FUNC(
                // disables foe's effects that "calculate damage using the lower of foe's Def or Res"
                // (including area-of-effect Specials),
                DISABLES_TARGETS_FOES_SKILLS_THAT_CALCULATE_DAMAGE_USING_THE_LOWER_OF_TARGETS_FOES_DEF_OR_RES_DURING_COMBAT_NODE,
            ),
        ]
    );
}

// Deluge Charm
{
    const skillId = Special.DelugeCharm;
    // @5
    setSpecialCountAndType(skillId, 5, true, true, false);
    // If an Assist skill is used, unit's Special cooldown count does not go down.
    NO_EFFECT_ON_SPECIAL_COOLDOWN_CHARGE_ON_SUPPORT_SKILL_SET.add(skillId);
    // When Special triggers,
    WHEN_APPLIES_SPECIAL_EFFECTS_AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // boosts damage by 70% of the greater of unit's or foe's Atk
        BOOSTS_DAMAGE_WHEN_SPECIAL_TRIGGERS_NODE(
            MAX_NODE(UNITS_ATK_NODE, FOES_ATK_NODE).percentage(70),
        )
        // (calculates damage from staff after combat damage is added).
    ));
    SkillEffectRegistrar.registerSkillsDuringCombat(skillId, TRUE_NODE,
        // Reduces damage from foe's first attack by 40% during combat
        UNIT.do(REDUCES_DAMAGE_FROM_FOES_FIRST_ATTACK_BY(40).duringCombat()
            // ("first attack" normally means only the first strike;
            // for effects that grant "unit attacks twice," it means the first and second strikes).
            .includingSecondStrike(),
        ),
    );
    // At start of player phase or enemy phase,
    setAtStartOfPlayerPhaseOrEnemyPhase(skillId, NODE_FUNC(
        // grants [Spd Liberate] and [Res Liberate] to unit and allies within 2 spaces of unit for 1 turn.
        GRANTS_STATUS_EFFECTS(
            StatusEffectType.SpdLiberate,
            StatusEffectType.ResLiberate,
        ).to(UNIT.and(ALLIES_WITHIN.spaces(2).of(UNIT))).forNTurn(1),
    ));
}

// Huge Personality
{
    const skillId = PassiveC.HugePersonality;
    // Disables foe's effects that "calculate damage using the lower of foe's Def or Res" (including area-of-effect Specials).
    DISABLES_FOES_SKILLS_THAT_CALCULATE_DAMAGE_USING_THE_LOWER_OF_FOES_DEF_OR_RES_SET.add(skillId);
    // If magic, staff, or dragon foe initiates combat against an ally within 2 spaces of unit, triggers [Savior] on unit.
    // TODO: Savior条件（magic, staff, or dragon foe）の実装が必要
    // For unit and allies within 3 rows or 3 columns centered on unit,
    let getSkills = unitNode => makeArray(
        // grants Atk/Spd/Def/Res+5,
        unitNode.do(GRANTS_BONUS(ATK_SPD_DEF_RES(5))).andEffects(
            // reduces damage from foe's attacks by 7 (excluding area-of-effect Specials),
            REDUCES_DAMAGE_FROM_FOES_ATTACKS_BY(7).excludingAoe(),
            // neutralizes effects that inflict "Special cooldown charge -X" on unit or ally, and
            NEUTRALIZES_EFFECTS_THAT_INFLICT_SPECIAL_COOLDOWN_CHARGE_MINUS_X.on(unitNode),
        ),
        // unit's or ally's next attack deals damage = 40% of foe's first-attack damage prior to reductions during combat
        // (resets at end of combat; only highest value applied; does not stack).
        TARGETS_NEXT_ATTACK_DEALS_DAMAGE_X_PERCENT_OF_TARGETS_FORES_ATTACK_PRIOR_TO_REDUCTION_ONLY_HIGHEST_VALUE_APPLIED_AND_DOES_NOT_STACK_NODE(40),
    );
    SkillEffectRegistrar.registerSkillsDuringCombat(skillId, TRUE_NODE,
        ...getSkills(UNIT),
        // Neutralizes foe's bonuses, and
        NEUTRALIZES_FOES_BONUSES_TO_STATS_DURING_COMBAT_NODE,
        UNIT.doEffects(
            // neutralizes effects that guarantee foe's follow-up attacks and
            NEUTRALIZES_EFFECTS_THAT_GUARANTEE_FOES_FOLLOW_UP_ATTACKS(true),
            // effects that prevent unit's follow-up attacks during combat.
            NEUTRALIZES_EFFECTS_THAT_PREVENT_UNITS_FOLLOW_UP_ATTACKS(true),
        ).duringCombat(),
    );
    SkillEffectRegistrar.registerSkillsForAlliesDuringCombat(skillId,
        IS_ALLY_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_UNIT_NODE,
        ...getSkills(ALLY),
    );
}

// Bow of Love+
{
    const skillId = Weapon.BowOfLovePlus;
    // Mt: 12
    // Rng: 2 Eff: E
    // Effective against flying foes.
    // At start of player phase or enemy phase,
    setAtStartOfPlayerPhaseOrEnemyPhase(skillId, NODE_FUNC(
        // grants Atk/Def+6,
        // "neutralizes foe's bonuses during combat," and
        // "Special cooldown charge +1 per attack during combat (only highest value applied; does not stack)"
        // to unit and allies within 2 spaces of unit for 1 turn.
        GRANTS_EFFECTS(
            ATK_DEF(6),
            StatusEffectType.NeutralizesFoesBonusesDuringCombat,
            StatusEffectType.SpecialCooldownChargePlusOnePerAttack,
        ).to(UNIT.and(ALLIES_WITHIN.spaces(2).of(UNIT))).forNTurn(1),
    ));
    SkillEffectRegistrar.registerSkillsDuringCombat(skillId, TRUE_NODE,
        // Grants Atk/Spd/Def/Res+5 to unit,
        GRANTS_BONUS(ATK_SPD_DEF_RES(5)).to(UNIT),
        UNIT.doEffects(
            // unit deals +20 damage (excluding area-of-effect Specials), and
            DEALS_DAMAGE(20).excludingAoe(),
            // reduces damage from foe's attacks by 10 during combat (excluding area-of-effect Specials).
            REDUCES_DAMAGE_FROM_FOES_ATTACKS_BY(10).excludingAoe(),
        ),
    );
}

// Draconic Bond
{
    const skillId = Weapon.DraconicBond;
    // Rng: 2
    // Accelerates Special trigger (cooldown count-1).
    // If a skill compares unit's Res to a foe's or ally's Res, treats unit's Res as if granted +5.
    AT_COMPARING_STATS_HOOKS.addSkill(skillId, () => RES(5));
    // At start of player phase or enemy phase,
    setAtStartOfPlayerPhaseOrEnemyPhase(skillId, NODE_FUNC(
        // grants Atk/Res+6, [Fell Spirit] and
        // "Special cooldown charge +1 per attack during combat (only highest value applied; does not stack)"
        // to unit and allies within 2 spaces of unit for 1 turn.
        GRANTS_EFFECTS(
            ATK_RES(6),
            StatusEffectType.FellSpirit,
            StatusEffectType.SpecialCooldownChargePlusOnePerAttack,
        ).to(UNIT.and(ALLIES_WITHIN.spaces(2).of(UNIT))).forNTurn(1),
    ));
    SkillEffectRegistrar.registerSkillsDuringCombat(skillId, TRUE_NODE,
        // Grants Atk/Spd/Def/Res+15 to unit,
        GRANTS_BONUS(ATK_SPD_DEF_RES(15)).to(UNIT),
        UNIT.doEffects(
            // unit deals +25 damage (excluding area-of-effect Specials),
            DEALS_DAMAGE(25).excludingAoe(),
            // reduces damage from foe's attacks by 15 (excluding area-of-effect Specials), and
            REDUCES_DAMAGE_FROM_FOES_ATTACKS_BY(15).excludingAoe(),
            // neutralizes effects that inflict "Special cooldown charge -X" on unit during combat.
            NEUTRALIZES_EFFECTS_THAT_INFLICT_SPECIAL_COOLDOWN_CHARGE_MINUS_X.on(UNIT),
        ),
        // If unit or foe is engaged, or if unit's Res > foe's Res,
        IF(OR_NODE(IS_TARGET_ENGAGED_NODE, IS_FOE_ENGAGED_NODE, UNIT.res.sgt(FOE.res)),
            // unit attacks twice during combat.
            UNIT.do(ATTACKS_TWICE).duringCombat(),
        ),
    );
}

    // A/R Detect Aerial - implemented above together with S/R Detect Aerial

// Fell Refuge
{
    const skillId = PassiveC.FellRefuge;
    // Enables [Canto (Dist.; Max 3, Min 1)].
    enablesCantoDistMin(skillId, 0, 3, 1);
    // Disables foe's skills that "calculate damage using the lower of foe's Def or Res" (including area-of-effect Specials).
    DISABLES_FOES_SKILLS_THAT_CALCULATE_DAMAGE_USING_THE_LOWER_OF_FOES_DEF_OR_RES_SET.add(skillId);
    // For unit and allies within 3 rows or 3 columns centered on unit,
    let getSkills = unitNode => makeArray(
        unitNode.doEffects(
            // grants Atk/Spd/Def/Res+5,
            GRANTS_BONUS(ATK_SPD_DEF_RES(5)),
            // deals +7 damage (excluding area-of-effect Specials),
            DEALS_DAMAGE(7).excludingAoe(),
            // reduces damage from foe's attacks by 7 during combat (excluding area-of-effect Specials), and also,
            REDUCES_DAMAGE_FROM_FOES_ATTACKS_BY(7).excludingAoe(),
        ),
        // if this unit's Res ≥ foe's Res+5 at start of combat,
        // and if foe's attack can trigger foe's Special,
        // inflicts Special cooldown count+1 on foe before foe's first attack and
        // before foe's first follow-up attack during combat
        // (cannot exceed foe's maximum Special cooldown).
        APPLY_SKILL_EFFECTS_AFTER_STATUS_FIXED_NODE(
            IF_NODE(AND_NODE(
                    GTE_NODE(UNITS_EVAL_RES_DURING_COMBAT_NODE, ADD_NODE(FOES_EVAL_RES_DURING_COMBAT_NODE, 5)),
                    CAN_FOES_ATTACK_TRIGGER_FOES_SPECIAL_NODE),
                INFLICTS_SPECIAL_COOLDOWN_COUNT_PLUS_N_ON_TARGETS_FOE_BEFORE_TARGETS_FOES_FIRST_ATTACK_NODE(1),
                INFLICTS_SPECIAL_COOLDOWN_COUNT_PLUS_N_ON_TARGETS_FOE_BEFORE_TARGETS_FOES_FIRST_FOLLOW_UP_ATTACK_NODE(1),
            ),
        ),
    );
    SkillEffectRegistrar.registerSkillsDuringCombat(skillId, TRUE_NODE,
        ...getSkills(UNIT),
    );
    SkillEffectRegistrar.registerSkillsForAlliesDuringCombat(skillId,
        IS_ALLY_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_UNIT_NODE,
        ...getSkills(ALLY),
    );
    SkillEffectRegistrar.registerSkillsDuringCombat(skillId, TRUE_NODE,
        // Reduces damage from foe's attacks by 40% during combat (excluding area-of-effect Specials),
        REDUCES_DAMAGE_FROM_TARGETS_FOES_ATTACKS_BY_X_PERCENT_DURING_COMBAT_NODE(40),
        UNIT.doEffects(
            // grants Special cooldown count-1 to unit before unit's first attack, and
            GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_X_BEFORE_UNITS_FIRST_ATTACK(1),
            // reduces the percentage of foe's non-Special "reduce damage by X%" skills by 50% during combat (excluding area-of-effect Specials).
            REDUCES_PERCENTAGE_OF_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_N_PERCENT(50).excludingAoe(),
        ),
    );
}

    // TODO: Duo Skill - デュオスキルの実装は専用フック（WHEN_TRIGGERS_DUO_OR_HARMONIZED_EFFECT_HOOKS）が必要
    // Grants [Divinely Inspiring], [Reflex], and "unit makes a guaranteed follow-up attack during combat" to unit and allies within 3 spaces of unit for 1 turn.

// Budding Staff
{
    const skillId = Weapon.BuddingStaff;
    // Mt: 14
    // Rng: 2
    // Calculates damage from staff like other weapons.
    // Accelerates Special trigger (cooldown count-1; max cooldown count value cannot be reduced below 1).
    // For foes within 3 rows or 3 columns centered on unit,
    SkillEffectRegistrar.registerSkillsForFoesDuringCombat(skillId,
        IS_TARGET_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_SKILL_OWNER_NODE,
        UNIT.doEffects(
            // inflicts Atk/Spd/Def/Res-5,
            INFLICTS_PENALTY(ATK_SPD_DEF_RES(5)).on(FOE),
            // reduces the percentage of foe's non-Special "reduce damage by X%" skills by 50% (excluding area-of-effect Specials), and
            REDUCES_PERCENTAGE_OF_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_N_PERCENT(50).excludingAoe(),
            // neutralizes foe's non-Special "if foe would reduce unit's HP to 0, unit survives with 1 HP" effects during combat.
            NEUTRALIZES_FOES_NON_SPECIAL_SURVIVING_WITH_1_HP.duringCombat(),
        ),
    );

    SkillEffectRegistrar.registerSkillsDuringCombat(skillId, TRUE_NODE,
        // Grants Atk/Spd/Def/Res+10 to unit,
        GRANTS_BONUS(ATK_SPD_DEF_RES(10)).to(UNIT),
        // unit deals +25 damage (excluding area-of-effect Specials), and
        UNIT.do(DEALS_DAMAGE(25).excludingAoe()).and(
            // reduces damage from foe's attacks by 15 during combat (excluding area-of-effect Specials).
            REDUCES_DAMAGE_FROM_FOES_ATTACKS_BY(15).excludingAoe(),
        ),
    );
    // Unit can use the following (Style) :
    // Freeze Style
    setUnitCanUseFollowingStyle(skillId, StyleType.FREEZE);
}

{
    const style = StyleType.FREEZE;
    const skillId = getStyleSkillId(style);
    CAN_ACTIVATE_STYLE_HOOKS.addSkill(skillId, () => TRUE_NODE);
    // ―――――――― Freeze Style ――――――――
    // Unit can attack foes within 6 spaces of unit and 3 rows or 3 columns centered on unit regardless of unit's range.
    CANNOT_MOVE_STYLE_ATTACK_RANGE_HOOKS.addSkill(skillId, () =>
        SPACES_OF_TARGET_NODE(AND_NODE(
            IS_SPACE_WITHIN_N_SPACES_OF_TARGET_NODE(6),
            IS_SPACE_WITHIN_N_ROWS_OR_M_COLUMNS_CENTERED_ON_TARGET_NODE(3, 3))
        ),
    );
    // (Damage dealt by unit's attacks and damage from foe's attacks during that combat are reduced to 0, and foes' Savior effects will not trigger (Røkkr take at least 1 damage).)
    SkillEffectRegistrar.registerSkillsDuringCombat(skillId,
        IS_STYLE_ACTIVE(style),
        // (Damage dealt by unit's attacks and damage from foe's attacks during that combat are reduced to 0, and
        UNIT.do(REDUCES_DAMAGE_FROM_FOE_TO_ZERO()),
        FOE.do(REDUCES_DAMAGE_FROM_FOE_TO_ZERO()),
    );
    // foes' Savior effects will not trigger (Røkkr take at least 1 damage).)
    BEFORE_AOE_SPECIAL_ACTIVATION_CHECK_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        IF_NODE(IS_STYLE_ACTIVE(style),
            // When unit is in combat, foes' Savior effects will not trigger.
            UNIT.do(DOES_NOT_TRIGGER_FOES_SAVIOR_EFFECTS()),
        ),
    ));
    AFTER_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        IF_NODE(IS_STYLE_ACTIVE(style),
            // After combat, inflicts【Gravity】,【Isolation】, and status preventing counterattacks on foe through its next action, and
            INFLICTS_STATUS_EFFECTS(
                StatusEffectType.Gravity,
                StatusEffectType.Isolation,
                StatusEffectType.CounterattacksDisrupted,
            ).on(FOE).throughTheirNextActions(),
            // grants another action to unit.
            GRANTS_ANOTHER_ACTION_TO_TARGET_AFTER_COMBAT_NODE,
        )
    ));

    // Unit cannot move or
    CANNOT_MOVE_STYLES.add(style);
    // attack structures,
    CANNOT_ATTACK_STRUCTURE_STYLES.add(style);
    // after-combat movement effects do not occur, and
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        IF_NODE(IS_STYLE_ACTIVE(style),
            UNIT.do(DISABLES_AFTER_COMBAT_MOVEMENT()),
        ),
    ));
    // remaining movement granted from Canto is treated as 0.
    STYLES_THAT_REMAINING_MOVEMENT_FROM_CANTO_IS_TREATED_AS_0.add(style);

    // Unit suffers a counterattack if any of the following conditions are met:
    SUFFERS_COUNTERATTACK_DURING_STYLE_HOOKS.addSkill(skillId, () =>
        OR_NODE(
            // foe is armored with Range = 2,
            AND_NODE(IS_FOE_ARMOR_NODE, FOES_RANGE_IS_2_NODE),
            // foe can counterattack regardless of unit's range, or
            CAN_FOE_COUNTERATTACK_REGARDLESS_OF_RANGE_NODE,
            // foe's Range is the same as the distance between unit and foe.
            EQ_NODE(FOES_RANGE_NODE, DISTANCE_BETWEEN_TARGET_AND_TARGETS_FOE_NODE),
        ),
    );
    // Skill effect's Range is treated as 2.
    STYLES_THAT_SKILLS_EFFECTS_RANGE_IS_TREATED_AS_2.add(style);
    // This Style can be used only once per turn.
    STYLES_THAT_CAN_BE_USED_ONLY_ONCE_PER_TURN.add(style);
    // TODO: 実装する
    // 【Style】
    // Change Style using the Style button at the bottom of the screen.
    // A unit's Style is only active when that unit is taking an action.
    // Style use is disabled when unit is deployed using Pair Up or when unit is equipped with multiple skills that have a Style.
}

// Windfire Charm
{
    const skillId = Special.WindfireCharm;
    // @5
    setSpecialCountAndType(skillId, 5, true, true, false);
    // If an Assist skill is used, unit's Special cooldown count does not go down.
    NO_EFFECT_ON_SPECIAL_COOLDOWN_CHARGE_ON_SUPPORT_SKILL_SET.add(skillId);
    // When Special triggers,
    WHEN_APPLIES_SPECIAL_EFFECTS_AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // boosts damage by 70% of the greater of unit's or foe's Atk
        BOOSTS_DAMAGE_WHEN_SPECIAL_TRIGGERS_NODE(
            MAX_NODE(UNITS_ATK_NODE, FOES_ATK_NODE).percentage(70),
        )
        // (calculates damage from staff after combat damage is added).
    ));
    SkillEffectRegistrar.registerSkillsDuringCombat(skillId, TRUE_NODE,
        // Reduces damage from foe's first attack by 40% during combat
        UNIT.do(REDUCES_DAMAGE_FROM_FOES_FIRST_ATTACK_BY(40).duringCombat()
            // ("first attack" normally means only the first strike;
            // for effects that grant "unit attacks twice," it means the first and second strikes).
            .includingSecondStrike(),
        ),
    );
    // At start of player phase or enemy phase,
    setAtStartOfPlayerPhaseOrEnemyPhase(skillId, NODE_FUNC(
        // grants [Atk Liberate] and [Spd Liberate] to unit and allies within 2 spaces of unit for 1 turn.
        GRANTS_STATUS_EFFECTS(
            StatusEffectType.AtkLiberate,
            StatusEffectType.SpdLiberate,
        ).to(UNIT.and(ALLIES_WITHIN.spaces(2).of(UNIT))).forNTurn(1),
    ));
}

// Budding Flower
{
    const skillId = PassiveC.BuddingFlower;
    // Enables [Canto (Dist.; Max 3, Min 1)] .
    enablesCantoDistMin(skillId, 0, 3, 1);
    // If unit initiates combat, after combat,
    AFTER_COMBAT_HOOKS.addSkill(skillId, NODE_FUNC(
        // inflicts [Undefended) and (Discord]
        INFLICTS_STATUS_EFFECTS(
            StatusEffectType.Undefended,
            StatusEffectType.Discord,
            // on target and foes within 2 spaces of target through their next actions, and
            // TODO: 戦闘後targetを表すノードを作成
        ).on(FOE.and(FOES_WITHIN.spaces(2).of(FOE))).throughTheirNextActions(),

        // applies [Divine Vein (Haze)]
        // on target's space and on each space within 2 spaces of target's space for 1 turn.
        FOR_EACH_SPACES_NODE(SPACES_WITHIN_N_SPACES_OF_FOE_NODE(2),
            APPLY_DIVINE_VEIN_NODE(DivineVeinType.Haze, SKILL_OWNER_GROUP_NODE, 1),
        ),
    ));

    SkillEffectRegistrar.registerSkillsDuringCombat(skillId, TRUE_NODE,
        // Grants Atk/Spd/Def/Res+5 to unit,
        GRANTS_BONUS(ATK_SPD_DEF_RES(5)).to(UNIT),
        // unit deals +7 damage (excluding area-of-effect Specials),
        UNIT.doEffects(
            DEALS_DAMAGE(7).excludingAoe(),
            // reduces damage from foe's attacks by 7 (excluding area-of-effect Specials), and
            REDUCES_DAMAGE_FROM_FOES_ATTACKS_BY(7).excludingAoe(),
        ),
        // neutralizes effects that inflict "Special cooldown charge -X" on unit during combat, and also,
        NEUTRALIZES_EFFECTS_THAT_INFLICT_SPECIAL_COOLDOWN_CHARGE_MINUS_X.on(UNIT),
        // if decreasing the Spd difference necessary to make a follow-up attack by 10
        // would allow unit to trigger a follow-up attack (excluding guaranteed or prevented follow-ups),
        IF(UNIT.check(CAN_DECREASING_SPD_TRIGGER_FOLLOW_UP_EXCLUDING_GUARANTEED_OR_PREVENTED_FOLLOW_UPS(10)),
            // triggers (Potent Follow 100% during combat.
            UNIT.do(TRIGGERS_POTENT_FOLLOW_N_PERCENT(100)).duringCombat(),
        ),
    );
}

// Instructor's Opus
{
    const skillId = Weapon.InstructorsOpus;
    // Mt: 14 Rng: 2
    // Accelerates Special trigger (cooldown count-1).
    // If a Rally or movement Assist skill is used by unit, grants another action to unit (once per turn).
    setIfRallyOrMovementAssistSkillIsUsedByUnit(skillId, NODE_FUNC(
        GRANTS_ANOTHER_ACTION.to(UNIT).oncePerTurn(),
    ));
    // If a Rally or movement Assist skill is used by unit or targets unit,
    setIfRallyOrMovementAssistSkillIsUsedByUnitOrTargetsUnit(skillId, NODE_FUNC(
        // inflicts Spd/Res-7, [Sabotage], and [Exposure]
        INFLICTS_EFFECTS(SPD_RES(7), StatusEffectType.Sabotage, StatusEffectType.Exposure)
            // on closest foes to both unit and target ally or unit and targeting ally after movement
            // and foes within 2 spaces of those foes through their next actions.
            .on(UNIT.closestFoes()
                .and(TARGET_ALLY.closestFoes())
                .and(FOES_WITHIN.spaces(2).of(UNIT.closestFoes()))
                .and(FOES_WITHIN.spaces(2).of(TARGET_ALLY.closestFoes()))
            ),
    ));
    SkillEffectRegistrar.registerSkillsDuringCombat(skillId, TRUE_NODE,
        // Grants Atk/Spd/Def/Res+15 to unit,
        GRANTS_BONUS(ATK_SPD_DEF_RES(15)).to(UNIT),
        UNIT.doEffects(
            // unit deals +25 damage (excluding area-of-effect Specials),
            DEALS_DAMAGE(25).excludingAoe(),
            // reduces damage from foe's attacks by 15 (excluding area-of-effect Specials), and
            REDUCES_DAMAGE_FROM_FOES_ATTACKS_BY(15).excludingAoe(),
            // neutralizes effects that inflict "Special cooldown charge -X" on unit during combat, and also,
            NEUTRALIZES_EFFECTS_THAT_INFLICT_SPECIAL_COOLDOWN_CHARGE_MINUS_X.on(UNIT),
        ),
        // if decreasing the Spd difference necessary to make a follow-up attack by 10
        // would allow unit to trigger a follow-up attack (excluding guaranteed or prevented follow-ups),
        IF(UNIT.check(CAN_DECREASING_SPD_TRIGGER_FOLLOW_UP_EXCLUDING_GUARANTEED_OR_PREVENTED_FOLLOW_UPS(10)),
            // triggers [Potent Follow 100%] during combat.
            UNIT.do(TRIGGERS_POTENT_FOLLOW_N_PERCENT(100)).duringCombat(),
        ),
    );
}

// Goddess Dance
{
    const skillId = Special.GoddessDance;
    // @4
    setSpecialCountAndType(skillId, 4, false, true, false, false);

    // Boosts damage by 80% of unit's Spd when Special triggers.
    WHEN_APPLIES_SPECIAL_EFFECTS_AT_START_OF_COMBAT_HOOKS.addSkill(skillId, NODE_FUNC(
        BOOSTS_DAMAGE_WHEN_SPECIAL_TRIGGERS_NODE(MULT_TRUNC_NODE(0.8, UNITS_SPD_DURING_COMBAT_NODE)),
    ));

    // Reduces damage from foe's attacks by 40% during combat (excluding area-of-effect Specials).
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, NODE_FUNC(
        REDUCES_DAMAGE_FROM_TARGETS_FOES_ATTACKS_BY_X_PERCENT_BY_SPECIAL_NODE(40),
    ));

    // If a Rally or movement Assist skill is used by unit and if target ally has already acted,
    // grants another action to target ally, and if Canto has already been triggered, re-enables Canto
    // (once per turn; this effect does not trigger if target ally has Sing or Dance).
    let effect1NodeFunc = () => new SkillEffectNode(
        FOR_TARGET_NODE(ASSIST_TARGET_NODE,
            IF_NODE(AND_NODE(
                IS_TARGET_ACTION_DONE_NODE,
                NOT_NODE(TARGET_HAS_REFRESH_ASSIST_NODE),
            ),
                GRANTS_ANOTHER_ACTION_TO_TARGET_ONCE_PER_TURN_ON_ASSIST_NODE,
                RE_ENABLES_CANTO_TO_TARGET_ON_MAP_NODE,
            ),
        ),
    );
    AFTER_RALLY_SKILL_IS_USED_BY_UNIT_HOOKS.addSkill(skillId, effect1NodeFunc);
    AFTER_MOVEMENT_SKILL_IS_USED_BY_UNIT_HOOKS.addSkill(skillId, effect1NodeFunc);

    // If a Rally or movement Assist skill is used by unit,
    // if there is only one ally with the highest HP among allies who have already acted
    // in spaces adjacent to unit after movement
    // (excluding target of Rally or movement Assist skill and allies with Sing or Dance),
    // grants another action to that ally, and if Canto has already been triggered, re-enables Canto
    // (will not trigger again for 2 turns after triggering).
    let eligibleAlliesNode = CACHE_NODE(`${skillId}_adjacent-acted-allies`,
        MAX_UNITS_NODE(
            FILTER_UNITS_NODE(
                TARGETS_ALLIES_WITHIN_N_SPACES_NODE(1),
                AND_NODE(
                    NOT_NODE(IS_TARGET_ASSIST_TARGET_NODE),
                    NOT_NODE(TARGET_HAS_REFRESH_ASSIST_NODE),
                    IS_TARGET_ACTION_DONE_NODE,
                ),
            ),
            TARGETS_HP_ON_MAP_NODE,
        ),
    );
    let effect2NodeFunc = () => new SkillEffectNode(
        IF_NODE(EQ_NODE(COUNT_UNITS_NODE(eligibleAlliesNode), 1),
            TARGETS_REST_SPECIAL_SKILL_AVAILABLE_TURN_NODE(2,
                FOR_EACH_UNIT_NODE(eligibleAlliesNode,
                    GRANTS_ANOTHER_ACTION_TO_TARGET_ONCE_PER_TURN_ON_ASSIST_NODE,
                    RE_ENABLES_CANTO_TO_TARGET_ON_MAP_NODE,
                ),
            ),
        ),
    );
    setIfRallyOrMovementAssistSkillEndedByUnit(skillId, effect2NodeFunc);

    // Equipping this skill counts as equipping a Sing or Dance skill.
    SPECIALS_COUNTED_AS_SING_OR_DANCE.add(skillId);
}

// Instruct 4
{
    const skillId = PassiveC.Instruct4;

    // ステータスごとの条件付きGreat Talent付与の共通ノード:
    // if unit's Atk, Spd, Def, or Res ≥ ally's stat - 10 (excluding effects from [Phantom]),
    // grants [Great Talent] +3 to ally's corresponding stat.
    // (This skill grants max of [Great Talent] +9.)
    // NOTE: TARGETS_STATS_ON_MAP_NODE は getStatusesInPrecombat() を使用し、Phantom(虚勢)は含まれない
    let greatTalentPerStatNode = FOR_EACH_STAT_INDEX_NODE(
        IF_NODE(GTE_NODE(
                GET_STAT_AT_NODE(FOR_TARGET_NODE(SKILL_OWNER_NODE, TARGETS_STATS_ON_MAP_NODE), READ_NUM_NODE),
                SUB_NODE(GET_STAT_AT_NODE(TARGETS_STATS_ON_MAP_NODE, READ_NUM_NODE), 10)),
            GRANTS_GREAT_TALENTS_PLUS_TO_TARGET_NODE(
                STATS_FROM_STAT_NODE(3, READ_NUM_NODE),
                STATS_FROM_STAT_NODE(9, READ_NUM_NODE)),
        ),
    );

    // At start of turn, for allies within 2 spaces of unit,
    // if unit's Atk, Spd, Def, or Res ≥ ally's stat - 10 (excluding effects from [Phantom]),
    // grants [Great Talent] +3 to ally's corresponding stat.
    // (This skill grants max of [Great Talent] +9.)
    AT_START_OF_TURN_HOOKS.addSkill(skillId, NODE_FUNC(
        FOR_EACH_TARGETS_ALLY_WITHIN_N_SPACES_NODE(2,
            greatTalentPerStatNode,
        ),
    ));

    // If a Rally or movement Assist skill is used by unit,
    // if unit's Atk, Spd, Def, or Res ≥ ally's stat - 10 (excluding effects from [Phantom]),
    // grants [Great Talent] +3 to target ally's corresponding stat
    // (for staff Assist skills, stat value is determined after Assist skill is used).
    // (This skill grants max of [Great Talent] +9.)
    let assistGreatTalentNode = () => new SkillEffectNode(
        FOR_TARGET_NODE(ASSIST_TARGET_NODE,
            greatTalentPerStatNode,
        ),
    );
    AFTER_RALLY_SKILL_IS_USED_BY_UNIT_HOOKS.addSkill(skillId, assistGreatTalentNode);
    AFTER_MOVEMENT_SKILL_IS_USED_BY_UNIT_HOOKS.addSkill(skillId, assistGreatTalentNode);

    SkillEffectRegistrar.registerSkillsDuringCombat(skillId, TRUE_NODE,
        // Grants Atk/Spd/Def/Res+X to unit
        // (X = maximum value of [Great Talent] among allies on the map; max 9;
        // calculates each stat bonus independently),
        FOR_EACH_STAT_INDEX_NODE(
            GRANTS_STAT_PLUS_AT_TO_TARGET_DURING_COMBAT_NODE(
                READ_NUM_NODE,
                ENSURE_MAX_NODE(
                    GET_STAT_AT_NODE(
                        new HighestValueOnEachStatAmongUnitsNode(
                            TARGETS_ALLIES_ON_MAP_NODE,
                            TARGETS_GREAT_TALENTS_STATS_NODE,
                        ),
                        READ_NUM_NODE,
                    ),
                    9,
                ),
            ),
        ),
        // unit deals +5 damage (excluding area-of-effect Specials), and
        UNIT.do(DEALS_DAMAGE(5).excludingAoe()),
        // reduces damage from foe's first attack by 5 during combat
        // ("first attack" normally means only the first strike;
        // for effects that grant "unit attacks twice," it means the first and second strikes).
        UNIT.do(REDUCES_DAMAGE_FROM_FOES_FIRST_ATTACK_BY(5).duringCombat().includingSecondStrike()),
    );
}

// TODO: Emblem Effect - エンゲージ関連の特殊効果のため、専用のフック実装が必要
// Enhanced Engaged Special:
// When Special triggers, boosts damage by unit's max Special cooldown count value × 4 (excluding area-of-effect Specials).
// When unit is not equipped with a character-specific Assist skill, if a Rally or movement Assist skill is used by unit and if target ally has already acted, grants another action to target ally, and if Canto has already been triggered, re-enables Canto (once per turn; this effect does not trigger if target ally has Sing or Dance).
// Equipping this skill counts as equipping a Sing or Dance skill.

{
    let skillId = Weapon.ArcaneLatona;
    // Accelerates Special trigger
    // (cooldown count-1; max cooldown count value cannot be reduced below 1).

    // At start of player phase or enemy phase,
    setAtStartOfPlayerPhaseOrEnemyPhase(skillId, NODE_FUNC(
        // grants【Imbue】to unit and allies within 3 spaces of unit for 1 turn.
        GRANTS_STATUS_EFFECTS(StatusEffectType.Imbue)
            .to(UNIT.and(ALLIES_WITHIN.spaces(3).of(UNIT))).forNTurn(1),
    ));

    // After start-of-turn effects trigger on player phase,
    // and after start-of-turn effects trigger on enemy phase
    // (except for in Summoner Duels),
    setAfterStartOfTurnEffectsTriggerOnPlayerOrEnemyPhaseExceptForInSummonerDuelsHooks(skillId, NODE_FUNC(
        // for unit and allies within 3 spaces of unit,
        FOR_UNIT(UNIT.and(ALLIES_WITHIN.spaces(3).of(UNIT))).withEffects(
            // neutralizes stat penalties and
            NEUTRALIZES_STAT_PENALTIES(StatFlags.ALL),
            // two【Penalty】 effects
            // (does not apply to Penalty effects that are applied at the same time;
            // neutralizes the first applicable Penalty effects
            // on unit's or ally's list of active effects).
            NEUTRALIZES_N_PENALTY_EFFECTS(2).firstApplicable(),
        ),
    ));

    SkillEffectRegistrar.registerSkillsDuringCombat(skillId,
        TRUE_NODE,
        // Grants Atk/Spd/Def/Res+15 to unit,
        GRANTS_BONUS(ATK_SPD_DEF_RES(15)).to(UNIT),
        // unit
        UNIT.doEffects(
            // deals +25 damage
            // (excluding area-of-effect Specials),
            DEALS_DAMAGE(25).excludingAoe(),
            // reduces damage from foe's attacks by 15
            // (excluding area-of-effect Specials),
            REDUCES_DAMAGE_FROM_FOES_ATTACKS_BY(15).excludingAoe(),
            // and reduces the percentage of foe's non-Special
            // "reduce damage by X%" skills by 50% during combat
            // (excluding area-of-effect Specials).
            REDUCES_PERCENTAGE_OF_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_N_PERCENT(50).duringCombat()
                .excludingAoe(),
        ),
    );
}

{
    let skillId = PassiveA.PeerlessBeauty;
    // At start of turn,
    AT_START_OF_TURN_HOOKS.addSkill(skillId, NODE_FUNC(
        // grants【Cancel Affinity】
        GRANTS_STATUS_EFFECTS(StatusEffectType.CancelAffinity).to(
            // to unit and allies within 2 spaces of unit.
            UNIT.and(ALLIES_WITHIN.spaces(2).of(UNIT))
        ),
    ));
    // At start of turn, and after unit acts (if Canto triggers, after Canto),
    setAtStartOfTurnAndAfterUnitActsIfCantoAfterCanto(skillId, NODE_FUNC(
        EFFECTS(
            // inflicts Spd/Res-7,
            INFLICTS_PENALTY(SPD_RES(7)),
            // 【Triangle Adept】,
            INFLICTS_STATUS_EFFECTS(StatusEffectType.TriangleAdept),
            // 【Sabotage】,
            INFLICTS_STATUS_EFFECTS(StatusEffectType.Sabotage),
            // and status preventing counterattacks
            INFLICTS_STATUS_EFFECTS(StatusEffectType.CounterattacksDisrupted),
            // on closest foes and any foes within 2 spaces of those foes through their next actions.
        ).on(CLOSEST_FOES.and(FOES_WITHIN.spaces(2).of(CLOSEST_FOES))).throughTheirNextActions(),
    ));
    SkillEffectRegistrar.registerSkillsDuringCombat(skillId, TRUE_NODE,
        // Grants Atk/Spd/Def/Res+9 to unit,
        GRANTS_BONUS(ATK_SPD_DEF_RES(9)).to(UNIT),
        UNIT.doEffects(
            // unit deals +7 damage
            // (excluding area-of-effect Specials),
            DEALS_DAMAGE(7).excludingAoe(),
            // reduces damage from foe's attacks by 7
            // (excluding area-of-effect Specials),
            REDUCES_DAMAGE_FROM_FOES_ATTACKS_BY(7).excludingAoe(),
            // and neutralizes effects
            // that guarantee foe's follow-up attacks
            NEUTRALIZES_EFFECTS_THAT_GUARANTEE_FOES_FOLLOW_UP_ATTACKS(true).duringCombat(),
            // and effects that prevent unit's follow-up attacks
            // during combat.
            NEUTRALIZES_EFFECTS_THAT_PREVENT_UNITS_FOLLOW_UP_ATTACKS(true).duringCombat(),
        ),
        // If decreasing the Spd difference necessary
        // to make a follow-up attack by 10
        // would allow unit to trigger a follow-up attack
        // (excluding guaranteed or prevented follow-ups),
        IF(UNIT.check(CAN_DECREASING_SPD_TRIGGER_FOLLOW_UP_EXCLUDING_GUARANTEED_OR_PREVENTED_FOLLOW_UPS(10)),
            // triggers【Potent Follow 100%】during combat.
            UNIT.do(TRIGGERS_POTENT_FOLLOW_N_PERCENT(100)).duringCombat(),
        ),
    );
}

// Preempt Amplify
{
    let skillId = PassiveB.PreemptAmplify;
    // Enables【Canto (２)】.
    enablesCantoN(skillId, 2);
    // If a Rally or movement Assist skill is used by unit,
    setIfRallyOrMovementAssistSkillIsUsedByUnit(skillId, NODE_FUNC(
        // grants【Preempt Pulse】and【Atk Liberate】
        GRANTS_STATUS_EFFECTS(
            StatusEffectType.PreemptPulse,
            StatusEffectType.AtkLiberate,
            // to unit, target ally, and allies within 2 spaces of target ally after movement for 1 turn.
        ).to(UNIT.and(TARGET_ALLY.and(ALLIES_WITHIN.spaces(2).of(TARGET_ALLY))).afterMovement()).forNTurn(1),
    ));
    SkillEffectRegistrar.registerSkillsForAlliesDuringCombat(skillId,
        // Allies on the map with【Preempt Pulse】active
        IS_STATUS_EFFECT_ACTIVE_ON_TARGET_NODE(StatusEffectType.PreemptPulse),
        // deal +7 damage during combat (excluding area-of-effect Specials).
        ALLY.do(DEALS_DAMAGE(7)).duringCombat().excludingAoe(),
    );
    SkillEffectRegistrar.registerSkillsDuringCombat(skillId, TRUE_NODE,
        // Inflicts Spd/Res-4 on foe,
        INFLICTS_PENALTY(SPD_RES(4)).on(FOE),
        // and unit deals +X × 5 damage during combat
        UNIT.do(DEALS_DAMAGE(MULT_NODE(X, 5)).duringCombat()
            // (max 15;
            .max(15)
            // X = number of allies on the map with【Preempt Pulse】 active, excluding unit;
            .x(NUM_OF_UNITS(ALLIES.with(HAS_TARGET_STATUS_EFFECT_NODE(StatusEffectType.PreemptPulse)).excluding(UNIT)))
            // excluding area-of-effect Specials).
            .excludingAoe()
        ),
    );
    CAN_RALLY_FORCIBLY_HOOKS.addSkill(skillId, () => TRUE_NODE);
}

// Purging Breath
{
    let skillId = Weapon.PurgingBreath;
    // Neutralizes "effective against flying" bonuses.
    // Enables【Canto (Rem. +1; Min ２)】.
    enablesCantoRemPlusMin(skillId, 1, 2);
    // Accelerates Special trigger (cooldown count-1).
    // If foe's Range = 2, calculates damage using the lower of foe's Def or Res.
    // At start of player phase or enemy phase,
    setAtStartOfPlayerPhaseOrEnemyPhase(skillId, NODE_FUNC(
        // grants Def/Res+6,【Fringe Bonus】, and 【Warp Bubble】
        EFFECTS(
            GRANTS_BONUS(DEF_RES(6)),
            GRANTS_STATUS_EFFECTS(StatusEffectType.FringeBonus),
            GRANTS_STATUS_EFFECTS(StatusEffectType.WarpBubble),
            // to unit and allies within 2 spaces of unit for 1 turn.
        ).to(UNIT.and(ALLIES_WITHIN.spaces(2).of(UNIT))).forNTurn(1),
    ));
    SkillEffectRegistrar.registerSkillsDuringCombat(skillId, TRUE_NODE,
        // Grants Atk/Spd/Def/Res+15 to unit,
        GRANTS_BONUS(ATK_SPD_DEF_RES(15)).to(UNIT),
        // unit deals +25 damage (excluding area-of-effect Specials),
        UNIT.doEffects(
            DEALS_DAMAGE(25).excludingAoe(),
            // reduces damage from foe's attacks by 15 (excluding area-of-effect Specials),
            REDUCES_DAMAGE_FROM_FOES_ATTACKS_BY(15).excludingAoe(),
            // reduces damage from foe's Specials by an additional 15 (excluding area-of-effect Specials),
            REDUCES_DAMAGE_FROM_FOES_SPECIALS_BY(15).excludingAoe(),
            // and grants Special cooldown charge +1 to unit per attack during combat (only highest value applied; does not stack).
            GRANTS_SPECIAL_COOLDOWN_CHARGE_PLUS_N(1).to(UNIT).perAttack().duringCombat().onlyHighestNotStack(),
        )
    );
}

{
    let skillId = Weapon.MeleeLancePlus;
    SkillEffectRegistrar.registerSkillsForFoesDuringCombat(skillId,
        // on foes within 3 rows or 3 columns centered on unit
        IS_TARGET_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_SKILL_OWNER_NODE,
        EFFECTS(
            // Inflicts Atk/Spd/Def/Res-5
            INFLICTS_PENALTY(ATK_SPD_DEF_RES(5)),
            // and neutralizes effects that grant "Special cooldown charge +X"
            NEUTRALIZES_EFFECTS_THAT_GRANT_SPECIAL_COOLDOWN_CHARGE_PLUS_X,
            // to those foes during their combat.
        ).to(FOE).duringCombat(),
    );
    // At start of combat, if unit's HP ≥ 25%,
    SkillEffectRegistrar.registerSkillsDuringCombat(skillId,
        IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE,
        // unit deals +X × 5 damage during combat
        UNIT.do(DEALS_DAMAGE(MULT_NODE(X, 5)).duringCombat()
            // (max 20; X = number of foes within 3 spaces of target, including target;
            .max(20).x(NUM_OF_UNITS(FOES_WITHIN.spaces(3).of(TARGET_FOE).include(TARGET_FOE)))
            // excluding area-of-effect Specials).
            .excludingAoe())
    );
}

// Unequaled Tome	14	2
{
    let skillId = Weapon.UnequaledTome;
    // Accelerates Special trigger (cooldown count-1).
    // Unit can move through foes' spaces.
    CAN_MOVE_THROUGH_FOES_SPACE_SKILLS.add(skillId);

    // unit can move to that space
    UNIT_CAN_MOVE_TO_A_SPACE_HOOKS.addSkill(skillId, () =>
        // If any space within 2 spaces of unit meets any of the following conditions,
        ANY_SPACE.withinSpaces(2).ofUnit(UNIT).meetAnyConditions(
            // - There is an ally.
            // - There is a Divine Vein effect applied.
            // - It is defensive terrain.
            // - It counts as difficult terrain, excluding impassable terrain.
            IS_THERE_ALLY,
            IS_THERE_DIVINE_VEIN_EFFECT_APPLIED,
            IS_IT_DEFENSIVE_TERRAIN,
            DOES_IT_COUNT_AS_DIFFICULT_TERRAIN_EXCLUDING_IMPASSABLE_TERRAIN,
            // or any space within 2 spaces of that space:
        ).orWithinSpacesOfThatSpaces(2),
    );
    // At start of turn, and after unit acts (if Canto triggers, after Canto),
    setAtStartOfTurnAndAfterUnitActsIfCantoAfterCanto(skillId, NODE_FUNC(
        // inflicts Atk/Res-7,
        // 【Sabotage】,
        // and a penalty that neutralizes non-Special "if foe would reduce unit's HP to 0, unit survives with 1 HP" effects
        EFFECTS(
            INFLICTS_PENALTY(ATK_RES(7)),
            INFLICTS_STATUS_EFFECTS(StatusEffectType.Sabotage),
            INFLICTS_STATUS_EFFECTS(StatusEffectType.NeutralizeUnitSurvivesWith1HP),
            // on closest foes and foes within 2 spaces of those foes through their next actions.
        ).on(CLOSEST_FOES.and(FOES_WITHIN.spaces(2).of(CLOSEST_FOES))).throughTheirNextActions(),
    ));
    SkillEffectRegistrar.registerSkillsDuringCombat(skillId, TRUE_NODE,
        // Grants Atk/Spd/Def/Res+15 to unit,
        GRANTS_BONUS(ATK_SPD_DEF_RES(15)).to(UNIT),
        UNIT.doEffects(
            // unit deals +25 damage (excluding area-of-effect Specials), and
            DEALS_DAMAGE(25).excludingAoe(),
            // reduces damage from foe's attacks by 15 during combat (excluding area-of-effect Specials).
            REDUCES_DAMAGE_FROM_FOES_ATTACKS_BY(15).duringCombat().excludingAoe(),
        ),
    );
}

// SuperiorTalent
{
    let skillId = PassiveA.SuperiorTalent;
    // Grants Atk/Spd/Def/Res+9.
    // Disables foe's effects that "calculate damage using the lower of foe's Def or Res" (including area-of-effect Specials).
    DISABLES_FOES_SKILLS_THAT_CALCULATE_DAMAGE_USING_THE_LOWER_OF_FOES_DEF_OR_RES_SET.add(skillId);
    // At start of player phase or enemy phase,
    setAtStartOfPlayerPhaseOrEnemyPhase(skillId, NODE_FUNC(
        // grants Atk/Res+6,【Creation Pulse】, and 【Canto (１)】
        GRANTS_EFFECTS(
            ATK_RES(6),
            StatusEffectType.CreationPulse,
            StatusEffectType.Canto1,
            // to unit and allies within 2 spaces of unit for 1 turn.
        ).to(UNIT.and(ALLIES_WITHIN.spaces(2).of(UNIT))).forNTurn(1),
    ));
    SkillEffectRegistrar.registerSkillsDuringCombat(skillId, TRUE_NODE,
        UNIT.doEffects(
            // Grants bonus to Atk = X × 80%
            GRANTS_BONUS(ATK(X.percentage(80)))
                // (X = A + B;
                .x(
                    ADD_NODE(
                        // A = highest total bonuses among unit and allies within 3 spaces of unit;
                        HIGHEST(TARGETS_TOTAL_BONUSES).among(UNIT.and(ALLIES_WITHIN.spaces(3).of(UNIT))),
                        // B = highest total penalties among foe and foes within 3 spaces of that foe),
                        HIGHEST(TARGETS_TOTAL_PENALTIES).among(FOE.and(FOES_WITHIN.spaces(3).of(FOE))),
                    ),
                ),
            // neutralizes unit's penalties to Atk/Res,
            NEUTRALIZES_STAT_PENALTIES(StatFlags.ATK_RES),
            // reduces damage from foe's attacks by 7 (excluding area-of-effect Specials), and
            REDUCES_DAMAGE_FROM_FOES_ATTACKS_BY(7).excludingAoe(),
            // reduces the percentage of foe's non-Special "reduce damage by X%" skills by 50% during combat
            REDUCES_PERCENTAGE_OF_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_N_PERCENT(50).duringCombat()
                // (excluding area-of-effect Specials).
                .excludingAoe(),
        ),
    );
}

// IlianLongsword
{
    let skillId = Weapon.IlianLongsword;
    // Accelerates Special trigger (cooldown count-1).
    // If a skill compares unit's Spd to a foe's or ally's Spd, treats unit's Spd as if granted +7.
    AT_COMPARING_STATS_HOOKS.addSkill(skillId, () => SPD(7))
    // At start of player phase or enemy phase,
    setAtStartOfPlayerPhaseOrEnemyPhase(skillId, NODE_FUNC(
        // grants 【Reflex】,【Dodge】, and【Truly Incited】
        GRANTS_EFFECTS(
            StatusEffectType.Reflex,
            StatusEffectType.Dodge,
            StatusEffectType.TrulyIncited,
            // to unit and allies within 2 spaces of unit for 1 turn.
        ).to(UNIT.and(ALLIES_WITHIN.spaces(2).of(UNIT))).forNTurn(1),
    ));
    SkillEffectRegistrar.registerSkillsDuringCombat(skillId, TRUE_NODE,
        // Grants Atk/Spd/Def/Res+15 to unit,
        GRANTS_BONUS(ATK_SPD_DEF_RES(15)).to(UNIT),
        UNIT.doEffects(
            // unit deals +25 damage (excluding area-of-effect Specials),
            DEALS_DAMAGE(25).excludingAoe(),
            // reduces damage from foe's attacks by 15 (excluding area-of-effect Specials),
            REDUCES_DAMAGE_FROM_FOES_ATTACKS_BY(15).excludingAoe(),
            // reduces damage from foe's Specials by an additional 15 (excluding area-of-effect Specials), and
            REDUCES_DAMAGE_FROM_FOES_SPECIALS_BY(15).excludingAoe(),
            // neutralizes effects that inflict "Special cooldown charge -X" on unit during combat.
            NEUTRALIZES_EFFECTS_THAT_INFLICT_SPECIAL_COOLDOWN_CHARGE_MINUS_X.on(UNIT),
        ),
        // If decreasing the Spd difference necessary to make a follow-up attack by 10 would allow unit to trigger a follow-up attack
        // (excluding guaranteed or prevented follow-ups),
        IF(UNIT.check(CAN_DECREASING_SPD_TRIGGER_FOLLOW_UP_EXCLUDING_GUARANTEED_OR_PREVENTED_FOLLOW_UPS(10)),
            // triggers【Potent Follow 100%】during combat.
            UNIT.do(TRIGGERS_POTENT_FOLLOW_N_PERCENT(100).duringCombat()),
        ),
    );
}

// 【Truly Incited】
{
    let skillId = getStatusEffectSkillId(StatusEffectType.TrulyIncited);
    SkillEffectRegistrar.registerSkillsDuringCombat(skillId, TRUE_NODE,
        UNIT.do(
            // Grants bonus to Atk/Spd/Def/Res during combat =
            GRANTS_BONUS(ATK_SPD_DEF_RES(
                // number of spaces from start position to end position of whoever initiated combat × 2 (max 8).
                NUM_OF_SPACES_START_TO_END_OF_WHOEVER_INITIATED_COMBAT_NODE.mult(2).max(8),
            )).duringCombat(),
        ),
    );
}

// Blue-Sky Gust
{
    let skillId = PassiveA.BlueSkyGust;
    // Enables【Canto (Dist. +1; Max ４)】.
    enablesCantoDist(skillId, 1, 4);
    SkillEffectRegistrar.registerSkillsDuringCombat(skillId,
        // If unit initiates combat or if there is an ally within 3 columns or 3 rows centered on unit,
        UNIT.check(INITIATED_COMBAT).or(THERE_IS(ALLIES_WITHIN.columns(3).rows(3).centeredOn(UNIT))),
        // grants Atk/Spd+10 to unit,
        GRANTS_BONUS(ATK_SPD(10)).to(UNIT),
        // unit deals +X×4 damage (excluding area-of-effect Specials), and
        UNIT.do(DEALS_DAMAGE(X.mult(4)).excludingAoe()).andEffects(
            // reduces damage from foe's first attack by X×3 during combat
            REDUCES_DAMAGE_FROM_FOES_FIRST_ATTACK_BY(X.mult(3)).duringCombat()
                // ("first attack" normally means only the first strike;
                // for effects that grant "unit attacks twice," it means the first and second strikes;
                .includingSecondStrike(),
            // X = number of allies within 3 rows or 3 columns centered on unit; max 3).
        ).x(NUM_OF(ALLIES_WITHIN.rowsOrColumns(3, 3).centeredOn(UNIT)).max(3)),
    );
}

{
    const skillId = Weapon.IlianGreatlance;
    // Enables【Canto (Dist. +1; Max ４)】.
    enablesCantoDist(skillId, 1, 4);
    // Grants Res+3.
    /**
     * @param {UnitNode} unitNode
     * @returns {SkillEffectNode[]}
     */
    const getSkills = unitNode => makeArray(
        // For unit and allies within 3 rows or 3 columns centered on unit,
        // grants Atk/Spd/Def/Res+Z (for unit, Z = 15; for allies, Z = 5) and
        unitNode.do(GRANTS_BONUS(ATK_SPD_DEF_RES(UNIT === unitNode ? 15 : 5))).and(
            // deals +Y damage (excluding area-of-effect Specials; for unit, Y = 25; for allies, Y = 10) during combat, and also,
            DEALS_DAMAGE(UNIT === unitNode ? 25 : 10).excludingAoe().duringCombat()
        ),
        // if decreasing the Spd difference necessary to make a follow-up attack by 25 would allow unit or ally to trigger a follow-up attack
        // (excluding guaranteed or prevented follow-ups),
        IF(unitNode.check(CAN_DECREASING_SPD_TRIGGER_FOLLOW_UP_EXCLUDING_GUARANTEED_OR_PREVENTED_FOLLOW_UPS(25)),
            // triggers【Potent Follow X%】during combat
            unitNode.do(TRIGGERS_POTENT_FOLLOW_N_PERCENT(X).duringCombat().x(
                // (if unit or ally cannot perform follow-up and attack twice, X = 100; otherwise, X = 50).
                IF_ELSE_NODE(unitNode.cannotAny(CAN_FOLLOWUP_ATTACK_WITHOUT_POTENT, CAN_ATTACK_TWICE),
                    100,
                    50,
                ))
            ),
        ),
    );
    SkillEffectRegistrar.registerSkillsDuringCombat(skillId, TRUE_NODE,
        ...getSkills(UNIT),
    );
    SkillEffectRegistrar.registerSkillsForAlliesDuringCombat(skillId,
        IS_ALLY_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_UNIT_NODE,
        ...getSkills(ALLY),
    );
    SkillEffectRegistrar.registerSkillsDuringCombat(skillId, TRUE_NODE,
        // Reduces damage from foe's attacks by 15 during combat (excluding area-of-effect Specials).
        UNIT.do(REDUCES_DAMAGE_FROM_FOES_ATTACKS_BY(15).excludingAoe().duringCombat()),
        // If unit initiates combat,
        IF(UNIT.check(INITIATED_COMBAT),
            // unit can make a follow-up attack before foe's next attack.
            UNIT.can(MAKE_FOLLOW_UP_ATTACK_BEFORE_FOES_NEXT_ATTACK),
        ),
    );
}

// Songful Essence	2
{
    const skillId = Support.SongfulEssence;
    setRefresh(skillId, 2);
    AFTER_REFRESH_SKILL_IS_USED_BY_UNIT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        // Grants another action to target ally, and
        // if Canto has already been triggered by target ally, re-enables Canto.
        IF(CANTO_HAS_ALREADY_BEEN_TRIGGERED.by(TARGET_ALLY),
            RE_ENABLES_CANTO.to(TARGET_ALLY),
        ),
    ));
    // At start of player phase or enemy phase,
    setAtStartOfPlayerPhaseOrEnemyPhase(skillId, NODE_FUNC(
        // grants 【Draconic Hex】and【Preempt Pulse】to unit and allies within 3 spaces of unit for 1 turn.
        GRANTS_STATUS_EFFECTS(
            StatusEffectType.DraconicHex,
            StatusEffectType.PreemptPulse,
        ).to(UNIT.and(ALLIES_WITHIN.spaces(3).of(UNIT))).forNTurn(1),
    ));
    /** @type {UnitsNode} */
    const targetAllies = ALLIES_WITHIN.spaces(3).of(UNIT);
    const targetAlliesWithin3SpacesOfUnit =
        // (if support partner other than calvary with a Range = 2 is on player team,
        IF_OTHERWISE_UNITS(
            UNIT.partners().otherThan(TARGET_NODE.isCavalry().and(TARGET_NODE.is(RANGE, 2))).isOnPlayerTeam(),
            // targets any support partner;
            targetAllies.filter(ARE_TARGET_AND_SKILL_OWNER_PARTNERS_NODE),
            // otherwise,
            // targets ally with the highest Atk at start of battle,
            targetAllies.withHighest(TARGETS_STATS_AT_START_OF_BATTLE.atk())
                // excluding unit and cavalry allies with Range = 2;
                .excluding(UNIT.and(ALLIES.with(TARGET_NODE.isCavalry().and(TARGET_NODE.is(RANGE, 2))))),
        );
    // "at start of battle" excludes increases to Atk granted after ally is deployed,
    // such as Legendary Effects, Mythic Effects, Bonus Heroes, Great Talent, etc.).
    // (Cannot target an ally with Sing or Dance. This skill treated as Sing or Dance.)
    // At start of turn,
    AT_START_OF_TURN_HOOKS.addSkill(skillId, NODE_FUNC(
        // grants "unit can move 1 extra space" (that turn only; does not stack)
        GRANTS_STATUS_EFFECTS(
            StatusEffectType.MobilityIncreased,
            // to target allies within 3 spaces of unit
        ).to(targetAlliesWithin3SpacesOfUnit).forNTurn(1),
    ));
}

// Ilian Battleaxe	16	1
{
    const skillId = Weapon.IlianBattleaxe;
    // Enables【Canto (Dist. +1; Max ４)】.
    enablesCantoDist(skillId, 1, 4);
    // Accelerates Special trigger (cooldown count-1).
    // At start of turn and after unit acts (if Canto triggers, after Canto),
    setAtStartOfTurnAndAfterUnitActsIfCantoAfterCanto(skillId, NODE_FUNC(
        EFFECTS(
            // inflicts Spd/Def-7, 【Frozen】, and【Sabotage】
            INFLICTS_PENALTY(SPD_DEF(7)),
            INFLICTS_STATUS_EFFECTS(StatusEffectType.Frozen),
            INFLICTS_STATUS_EFFECTS(StatusEffectType.Sabotage),
            // on closest foes and foes within 2 spaces of those foes through their next actions.
        ).on(CLOSEST_FOES.and(FOES_WITHIN.spaces(2).of(CLOSEST_FOES))).throughTheirNextActions(),
    ));
    SkillEffectRegistrar.registerSkillsDuringCombat(skillId, TRUE_NODE,
        // Grants Atk/Spd/Def/Res+15 to unit,
        GRANTS_BONUS(ATK_SPD_DEF_RES(15)).to(UNIT),
        // unit deals +25 damage (excluding area-of-effect Specials),
        UNIT.do(DEALS_DAMAGE(25).excludingAoe()).andEffects(
            // reduces damage from foe's attacks by 15 (excluding area-of-effect Specials), and
            REDUCES_DAMAGE_FROM_FOES_ATTACKS_BY(15).excludingAoe(),
            // reduces damage from foe's Specials by an additional 15 during combat (excluding area-of-effect Specials), and also,
            REDUCES_DAMAGE_FROM_FOES_SPECIALS_BY(15).duringCombat().excludingAoe(),
        ),
        // when unit's Special triggers, neutralizes foe's "reduces damage by X%" effects from non-Special skills
        UNIT.do(INVALIDATES_FOES_NON_SPECIAL_DAMAGE_REDUCTION_ON_SPECIAL_ACTIVATION()),
        // (excluding area-of-effect Specials).
    );
}

// Dragoon Pillar
{
    const skillId = PassiveA.DragoonPillar;
    // At start of player phase or enemy phase,
    setAtStartOfPlayerPhaseOrEnemyPhase(skillId, NODE_FUNC(
        // grants 【Atk Liberate】,【Spd Liberate】, and "neutralizes 'effective against flying' bonuses"
        GRANTS_STATUS_EFFECTS(
            StatusEffectType.AtkLiberate,
            StatusEffectType.SpdLiberate,
            StatusEffectType.ShieldFlying,
            // to unit and allies within 2 spaces of unit for 1 turn.
        ).to(UNIT.and(ALLIES_WITHIN.spaces(2).of(UNIT))).forNTurn(1),
    ));
    SkillEffectRegistrar.registerSkillsDuringCombat(skillId, TRUE_NODE,
        // Grants Atk/Spd/Def/Res+9 to unit,
        GRANTS_BONUS(ATK_SPD_DEF_RES(9)).to(UNIT),
        // unit deals +7 damage (excluding area-of-effect Specials),
        UNIT.doEffects(
            DEALS_DAMAGE(7).excludingAoe(),
            // reduces damage from foe's attacks by 7 (excluding area-of-effect Specials),
            REDUCES_DAMAGE_FROM_FOES_ATTACKS_BY(7).excludingAoe(),
            // inflicts Special cooldown charge -1 on foe per attack (only highest value applied; does not stack), and
            INFLICTS_SPECIAL_COOLDOWN_CHARGE_MINUS_N_ON_FOE(1).perAttack().onlyHighestNotStack(),
            // grants Special cooldown count-X to unit before unit's first attack
            GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_X_BEFORE_UNITS_FIRST_ATTACK(X).duringCombat(),
            // and before unit's first follow-up attack during combat
            GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_X_BEFORE_UNITS_FIRST_FOLLOW_UP_ATTACK(X).duringCombat(),
            // (X = number of staff and flying allies on the map, including unit; max 3).
        ).x(NUM_OF(ALLIES_ON_MAP.anyOf(TARGET_NODE.isStaff(), TARGET_NODE.isFlying()).including(UNIT)).max(3)),
        // Restores 7 HP to unit after combat.
        RESTORES_HP_AFTER_COMBAT(7).to(UNIT),
    );
}

// Skybound Bow	14	2
{
    const skillId = Weapon.SkyboundBow;
    // Accelerates Special trigger (cooldown count-1).
    // Effective against flying foes.
    // If a Rally or movement Assist skill is used by unit,
    setIfRallyOrMovementAssistSkillIsUsedByUnit(skillId, NODE_FUNC(
        // grants【Coax】to target for 1 turn and
        GRANTS_STATUS_EFFECTS(StatusEffectType.Coax).to(TARGET).forNTurn(1),
        // grants another action to unit (once per turn).
        GRANTS_ANOTHER_ACTION.to(UNIT).oncePerTurn(),
    ));
    // If a Rally or movement Assist skill is used by unit or targets unit,
    setIfRallyOrMovementAssistSkillIsUsedByUnitOrTargetsUnit(skillId, NODE_FUNC(
        // inflicts Atk/Spd/Def-7, 【Exposure】, and【Panic】
        INFLICTS_EFFECTS(ATK_SPD_DEF(7), StatusEffectType.Exposure, StatusEffectType.Panic)
            // on closest foes to both unit and target ally or unit and targeting ally after movement
            .on(UNIT.closestFoes()
                .and(TARGET_ALLY.closestFoes())
                // and foes within 2 spaces of those foes through their next actions.
                .and(FOES_WITHIN.spaces(2).of(UNIT.closestFoes()))
                .and(FOES_WITHIN.spaces(2).of(TARGET_ALLY.closestFoes()))
            ),
    ));
    SkillEffectRegistrar.registerSkillsForAlliesDuringCombat(skillId,
        // Allies on the map with【Coax】active deal +7 damage during combat (excluding area-of-effect Specials).
        IS_STATUS_EFFECT_ACTIVE_ON_TARGET_NODE(StatusEffectType.Coax),
        ALLY.do(DEALS_DAMAGE(7).duringCombat().excludingAoe()),
        // If Savior has not triggered,
        IF(ALLY.not(SAVIOR_HAS_TRIGGERED),
            // those allies attack twice during combat.
            ALLY.do(ATTACKS_TWICE.duringCombat())
        )
    );
    SkillEffectRegistrar.registerSkillsDuringCombat(skillId, TRUE_NODE,
        // Grants Atk/Spd/Def/Res+15 to unit,
        GRANTS_BONUS(ATK_SPD_DEF_RES(15)).to(UNIT),
        // unit deals +25 damage (excluding area-of-effect Specials),
        UNIT.do(DEALS_DAMAGE(25).excludingAoe()).andEffects(
            // grants Special cooldown charge +1 to unit per attack (only highest value applied; does not stack), and
            GRANTS_SPECIAL_COOLDOWN_CHARGE_PLUS_N(1).to(UNIT).perAttack().onlyHighestNotStack(),
            // reduces damage from foe's attacks by 15 during combat (excluding area-of-effect Specials).
            REDUCES_DAMAGE_FROM_FOES_ATTACKS_BY(15).duringCombat().excludingAoe(),
        ),
        // If unit's Spd > foe's Spd or if unit is not adjacent to an ally with an active【Coax】effect,
        IF(UNIT.spd.sgt(FOE.spd).or(UNIT.isAdjacentTo(ALLIES.withStatus(StatusEffectType.Coax)).not()),
            // unit attacks twice during combat.
            UNIT.do(ATTACKS_TWICE).duringCombat(),
        ),
    );
}

// 【Coax】
{
    // NOTE: それ自体には効果のないスキル
    // const skillId = getStatusEffectSkillId(StatusEffectType.Coax);
    // Grants a status that can trigger certain skill effects to unit.
}

// Waning Shot	4
{
    const skillId = Special.WaningShot;
    setSpecialCountAndType(skillId, 4, true, true, false);
    WHEN_APPLIES_SPECIAL_EFFECTS_AT_START_OF_COMBAT_HOOKS.addSkill(skillId, NODE_FUNC(
        // Boosts damage by 80% of the greater of unit's Spd or Def when Special triggers.
        UNIT.do(BOOSTS_DAMAGE_BY(PERCENTAGE_NODE(80, GREATER(UNIT.spd, UNIT.def))).whenSpecialTriggers()),
    ));
    SkillEffectRegistrar.registerSkillsDuringCombat(skillId, TRUE_NODE,
        // Inflicts penalty on foe’s Atk/Def =
        INFLICTS_PENALTY(TO_ATK_DEF(
            // highest penalty on each stat between target and foes within 2 spaces of target
            // (calculates each stat penalty independently) and
            HIGHEST_PENALTIES_ON_EACH_STAT_BETWEEN_TARGET_AND_TARGET_ALLIES_WITHIN_N_SPACES_NODE(2),
        )).on(FOE),
        // reduces damage from foe's first attack by 40% during combat
        // ("first attack" normally means only the first strike; for effects that grant "unit attacks twice," it means the first and second strikes).
        // TODO: 奥義としての登録をできるようにする（同じ文言でも奥義扱いにする）
        REDUCES_DAMAGE_FROM_FOES_FIRST_ATTACK_BY_N_PERCENT_BY_SPECIAL_DURING_COMBAT_INCLUDING_TWICE_NODE(40),
    );
}

// Atk/Spd Airspace
{
    const skillId = PassiveA.AtkSpdAirspace;
    // Enables【Canto (２)】.
    enablesCantoN(skillId, 2);
    SkillEffectRegistrar.registerSkillsDuringCombat(skillId,
        // If unit initiates combat or is within 3 spaces of an ally,
        // TODO: `isWithin`メソッドの作成
        UNIT.check(INITIATED_COMBAT).or(IS_TARGET_WITHIN_3_SPACES_OF_TARGETS_ALLY_NODE),
        // grants Atk/Spd+10 to unit and
        GRANTS_BONUS(ATK_SPD(10)).to(UNIT),
        // unit deals +X damage during combat (excluding area-of-effect Specials;
        UNIT.do(DEALS_DAMAGE(X).duringCombat().excludingAoe())
            .x(
                // if any space within 2 spaces of unit or foe has a Divine Vein effect applied,
                // is defensive terrain, or counts as difficult or impassable terrain for units other than flying, X = 12; otherwise, X = 7),
                // TODO: リファクタリング
                IF_VALUE_NODE(
                    SOME_NODE(
                        MAP_SPACES_NODE(
                            SPACES_WITHIN_N_SPACES_OF_TARGET_OR_TARGET_FOE_NODE(2),
                            OR_NODE(
                                HAS_DIVINE_VEIN_NODE,
                                IS_DEFENSIVE_TERRAIN_NODE,
                                COUNTS_AS_DIFFICULT_OR_IM_PASSABLE_TERRAIN_NODE_FOR_UNITS_OTHER_THAN_FLYING_NODE,
                            )
                        )
                    ),
                    12,
                    7,
                ),
            ),
        // and restores 7 HP to unit after combat.
        RESTORES_HP_AFTER_COMBAT(7).to(UNIT),
    );
}

// Harmonized Skill
{
    const skillId = getDuoOrHarmonizedSkillId(Hero.HarmonizedHilda);
    WHEN_TRIGGERS_DUO_OR_HARMONIZED_EFFECT_HOOKS.addSkill(skillId, NODE_FUNC(
        // Grants【Resonance: Blades】to unit and allies from the same titles as unit.
        GRANTS_STATUS_EFFECTS(StatusEffectType.ResonantBlades).to(UNIT.and(ALLIES_FROM_SAME_TITLES_AS_UNIT)),
        // Inflicts【Frozen】and【Share Spoils+】on closest foes and any foe within 2 spaces of those foes through their next actions.
        INFLICTS_STATUS_EFFECTS(StatusEffectType.Frozen, StatusEffectType.ShareSpoils)
            .on(CLOSEST_FOES.and(FOES_WITHIN.spaces(2).of(CLOSEST_FOES))).throughTheirNextActions(),
        // (Harmonized Skills can be used by tapping the Harmonized button. This skill can only be used once per map. Harmonized Skills cannot be used by units deployed using Pair Up.)
        // (When unit has a status or a skill that enables use of a Style, Duo Skills and Harmonized Skills cannot be used while unit can take an action (those skills can be used after unit has acted).)
    ));
}
