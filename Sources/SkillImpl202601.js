// スキル実装
// Budding Staff
// Mt: 14
// Rng: 2
// Calculates damage from staff like other weapons.
// Accelerates Special trigger (cooldown count-1; max cooldown count value cannot be reduced below 1).
// For foes within 3 rows or 3 columns centered on unit, inflicts Atk/Spd/Def/Res-5, reduces the percentage of foe's non-Special "reduce damage by X%" skills by 50% (excluding area-of-effect Specials), and neutralizes foe's non-Special "if foe would reduce unit's HP to 0, unit survives with 1 HP" effects during combat.
// Grants Atk/Spd/Def/Res+10 to unit, unit deals +25 damage (excluding area-of-effect Specials), and reduces damage from foe's attacks by 15 during combat (excluding area-of-effect Specials).
// Unit can use the following (Style) :
// Freeze Style

// Windfire Charm
// @5
// If an Assist skill is used, unit's Special cooldown count does not go down.
// When Special triggers, boosts damage by 70% of the greater of unit's or foe's Atk (calculates damage from staff after combat damage is added).
// Reduces damage from foe's first attack by 40% during combat ("first attack" normally means only the first strike; for effects that grant "unit attacks twice," it means the first and second strikes).
// At start of player phase or enemy phase, grants [Atk Liberate] and [Spd Liberate] to unit and allies within 2 spaces of unit for 1 turn.

// Budding Flower
// Enables [Canto (Dist.; Max 3, Min 1)] .
// If unit initiates combat, after combat, inflicts [Undefended) and (Discord] on target and foes within 2 spaces of target through their next actions, and applies [Divine Vein (Haze)] on target's space and on each space within 2 spaces of target's space for 1 turn.
// Grants Atk/Spd/Def/Res+5 to unit, unit deals +7 damage (excluding area-of-effect Specials), reduces damage from foe's attacks by 7 (excluding area-of-effect Specials), and neutralizes effects that inflict "Special cooldown charge -X" on unit during combat, and also, if decreasing the Spd difference necessary to make a follow-up attack by 10 would allow unit to trigger a follow-up attack (excluding guaranteed or prevented follow-ups), triggers (Potent Follow 100% during combat.

// Style
// Unit can use the following (Style) :
// Freeze Style
// Unit can attack foes within 6 spaces of unit and 3 rows or 3 columns centered on unit regardless of unit's range. (Damage dealt by unit's attacks and damage from foe's attacks during that combat are reduced to O, and foes' Savior effects will not trigger (Røkkr take at least 1 damage).)
// After combat, inflicts (Gravity) , (Isolation] , and status preventing counterattacks on foe through its next action, and grants another action to unit.
// Unit cannot move or attack structures, after-combat movement effects do not occur, and remaining movement granted from Canto is treated as O. Unit suffers a counterattack if any of the following
// conditions are met: foe is armored with Range = 2,
// foe can counterattack regardless of unit's range, or foe's Range is the same as the distance between unit and foe. Skill effect's Range is treated as 2. This Style can be used only once per turn.

// Instructor's Opus
// Mt: 14 Rng:2
// Accelerates Special trigger (cooldown count-1).
// If a Rally or movement Assist skill is used by unit, grants another action to unit (once per turn).
// If a Rally or movement Assist skill is used by unit or targets unit, inflicts Spd/Res-7, (Sabotage), and (Exposure] on closest foes to both unit and target ally or unit and targeting ally after movement and foes within 2 spaces of those foes through their next actions.
// Grants Atk/Spd/Def/Res+15 to unit, unit deals +25 damage (excluding area-of-effect Specials), reduces damage from foe's attacks by 15 (excluding area-of-effect Specials), and neutralizes effects that inflict "Special cooldown charge -X" on unit during combat, and also, if decreasing the Spd difference necessary to make a follow-up attack by 10 would allow unit to trigger a follow-up attack (excluding guaranteed or prevented follow-ups), triggers (Potent Follow 100%] during combat.

// Goddess Dance @4
// Boosts damage by 80% of unit's Spd when Special triggers.
// Reduces damage from foe's attacks by 40% during combat (excluding area-of-effect Specials).
// If a Rally or movement Assist skill is used by unit and if target ally has already acted, grants another action to target ally, and if Canto has already been triggered, re-enables Canto (once per turn; this effect does not trigger if target ally has Sing or Dance).
// If a Rally or movement Assist skill is used by unit, if there is only one ally with the highest HP among allies who have already acted in spaces adjacent to unit after movement (excluding target of Rally or movement Assist skill and allies with Sing or Dance), grants another action to that ally, and if Canto has already been triggered, re-enables Canto (will not trigger again for 2 turns after triggering).
// Equipping this skill counts as equipping a Sing or Dance skill.

// Instruct 4
// At start of turn, for allies within 2 spaces of unit, if unit's Atk, Spd, Def, or Res ≥ ally's stat - 10 (excluding effects from (Phantom]), grants (Great Talent] +3 to ally's corresponding stat.
// If a Rally or movement Assist skill is used by unit, if unit's Atk, Spd, Def, or Res ≥ ally's stat - 10 (excluding effects from (Phantom)), grants (Great Talent) +3 to target ally's corresponding stat (for staff Assist skills, stat value is determined after Assist skill is used).
// Grants Atk/Spd/Def/Res+X to unit (X = maximum value
// of [Great Talent) among allies on the map; max 9; calculates each stat bonus independently), unit deals +5 damage (excluding area-of-effect Specials), and reduces damage from foe's first attack by 5 during combat ("first attack" normally means only the first strike; for effects that grant "unit attacks twice,
// " it means the first
// and second strikes).
// (This skill grants max of [Great Talent] +9.)

// Emblem Effect
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
        IF(CAN_DECREASING_SPD_TRIGGER_FOLLOW_UP_EXCLUDING_GUARANTEED_OR_PREVENTED_FOLLOW_UPS(10).to(UNIT),
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
            INFLICTS_STATUS_EFFECTS(StatusEffectType.FringeBonus),
            INFLICTS_STATUS_EFFECTS(StatusEffectType.WarpBubble),
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
