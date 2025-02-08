const TARGET_CAN_ACTIVATE_NON_SPECIAL_MIRACLE_ONCE_PER_TURN_NODE =
    IF_NODE(NOT_NODE(IS_TARGETS_TEAMS_MIRACLE_WITHOUT_SPECIAL_ACTIVATED_ON_CURRENT_TURN_NODE),
        TARGET_CAN_ACTIVATE_NON_SPECIAL_MIRACLE_NODE(0),
    );

const IS_THERE_SKILL_OWNERS_PARTNER_ON_MAP_NODE =
    IS_THERE_UNIT_ON_MAP_NODE(ARE_TARGET_AND_SKILL_OWNER_PARTNERS_NODE);

const FOE_AND_FOES_ALLIES_WITHIN_N_ROWS_OR_N_COLUMNS_CENTERED_ON_FOE_NODE =
    n => FILTER_UNITS_NODE(FOE_AND_FOES_ALLIES_ON_MAP_NODE,
        IS_TARGET_WITHIN_N_ROWS_OR_N_COLUMNS_CENTERED_ON_FOE_NODE(n));

const NUM_OF_PENALTY_ON_FOE_AND_FOES_WITHIN_N_ROWS_OR_N_COLUMNS_CENTERED_ON_THAT_FOE_EXCLUDING_STAT_NODE =
    n => SUM_NODE(
        MAP_UNITS_TO_NUM_NODE(
            FOE_AND_FOES_ALLIES_WITHIN_N_ROWS_OR_N_COLUMNS_CENTERED_ON_FOE_NODE(n),
            NUM_OF_PENALTIES_ON_TARGET_EXCLUDING_STAT_NODE,
        )
    );

/**
 * total damage dealt to foe
 */
const ASSIST_TARGETING_AND_TARGET_NODE = UnitsNode.makeFromUnits(ASSIST_TARGETING_NODE, ASSIST_TARGET_NODE);

const TOTAL_DAMAGE_DEALT_TO_FOE_DURING_COMBAT_NODE = SUB_NODE(new FoesMaxHpNode(), new FoesHpDuringCombatNode());

const PERCENTAGE_NODE = (percentage, num) => MULT_TRUNC_NODE(percentage / 100.0, num);

const TARGETS_CLOSEST_FOES_WITHIN_5_SPACES_NODE = new TargetsClosestFoesWithinNSpacesNode(5);
const TARGETS_CLOSEST_FOES_WITHIN_5_SPACES_AND_FOES_ALLIES_WITHIN_2_SPACES_OF_THOSE_FOES_NODE =
    new TargetsAndThoseAlliesWithinNSpacesNode(2, TARGETS_CLOSEST_FOES_WITHIN_5_SPACES_NODE);
const TARGETS_CLOSEST_FOES_NODE = new TargetsClosestFoesNode();
/**
 * @param {number|NumberNode} n
 * @param {BoolNode} pred
 * @returns {UnitsNode}
 * @constructor
 */
const TARGETS_CLOSEST_FOES_AND_FOES_ALLIES_WITHIN_N_SPACES_OF_THOSE_FOES_NODE = (n, pred) =>
    new FilterUnitsNode(new TargetsAndThoseAlliesWithinNSpacesNode(n, TARGETS_CLOSEST_FOES_NODE), pred);

const CLOSEST_FOES_WITHIN5_SPACES_OF_BOTH_ASSIST_TARGETING_AND_ASSIST_TARGET_AND_FOES_WITHIN2_SPACES_OF_THOSE_FOES_NODE =
    new UnitsOfBothAssistTargetingAndAssistTargetNode(
        TARGETS_CLOSEST_FOES_WITHIN_5_SPACES_AND_FOES_ALLIES_WITHIN_2_SPACES_OF_THOSE_FOES_NODE
    );

/**
 * number of foes on the map with the【Discord】 effect active
 */
const NUM_OF_TARGETS_FOES_ON_MAP_WITH_STATUS_EFFECT_ACTIVE_NODE = (e) =>
    new CountIfUnitsNode(TARGETS_FOES_NODE, new HasTargetStatusEffectNode(e))

/**
 * foes that are within 2 spaces of another foe
 */
const TARGETS_FOES_THAT_ARE_WITHIN_N_SPACES_OF_ANOTHER_TARGETS_FOE_NODE =
    n => FILTER_UNITS_NODE(TARGETS_FOES_NODE, IS_TARGET_WITHIN_N_SPACES_OF_TARGETS_ALLY_NODE(n))

/**
 * 生の息吹4のようなHP回復効果。
 * @param {number|NumberNode} hpPercentage
 * @param {number|NumberNode} maxHpPercentage
 * @returns {SkillEffectNode}
 * @constructor
 */
const RESTORE_X_HP_LIKE_BREATH_OF_LIFE_4_NODE =
    (hpPercentage = 20, maxHpPercentage = 40) => new SkillEffectNode(
        new NumThatIsNode(
            // restores X HP to unit as unit's combat begins
            new RestoresXHPToTargetAsTargetsCombatBeginsNode(READ_NUM_NODE),
            // (triggers after effects that deal damage as combat begins;
            new EnsureMaxNode(
                // if unit's Def > foe's Def,
                COND_OP(GT_NODE(UNITS_EVAL_DEF_DURING_COMBAT_NODE, FOES_EVAL_DEF_DURING_COMBAT_NODE),
                    // X = 20% of unit's max HP + difference between stats × 4; otherwise,
                    ADD_NODE(
                        MULT_TRUNC_NODE(hpPercentage / 100, new TargetsMaxHpNode()),
                        MULT_NODE(SUB_NODE(UNITS_EVAL_DEF_DURING_COMBAT_NODE, FOES_EVAL_DEF_DURING_COMBAT_NODE), 4),
                    ),
                    // X = 20% of unit's max HP;
                    MULT_TRUNC_NODE(hpPercentage / 100, new TargetsMaxHpNode()),
                ),
                // max 40% of unit's max HP + damage dealt to unit as combat begins; only highest value applied; does not stack).
                ADD_NODE(
                    MULT_TRUNC_NODE(maxHpPercentage / 100, new TargetsMaxHpNode()),
                    new DamageDealtToTargetAsCombatBeginsNode(),
                ),
            ),
        ),
    );

function setDivineNectarAnotherActionSkill(skillId) {
    // 自分を除く【神獣の蜜】が付与されている味方が応援、移動系補助（体当たり、引き戻し、回り込み等）を使用した時、
    // その味方を行動可能な状態にする
    // （同じタイミングで自分を行動可能な状態にする他の効果が発動した場合、この効果も発動したものとする）
    // （1ターンに1回のみ）
    let nodeFunc = () => new SkillEffectNode(
        IF_NODE(AND_NODE(
                new HasAssistTargetingStatusEffectNode(StatusEffectType.DivineNectar),
                ARE_SKILL_OWNER_AND_ASSIST_TARGETING_IN_SAME_GROUP_NODE
            ),
            // if another effect that grants action to ally has been activated at the same time, this effect is also considered to have been triggered
            IF_NODE(NOT_NODE(IS_ANOTHER_ACTION_BY_ASSIST_ACTIVATED_IN_CURRENT_TURN_ON_SKILL_OWNER_TEAM_NODE),
                GRANTS_ANOTHER_ACTION_TO_ASSIST_TARGETING_ON_ASSIST_NODE,
            ),
        ),
    );
    AFTER_RALLY_ENDED_BY_OTHER_UNIT_HOOKS.addSkill(skillId, nodeFunc);
    AFTER_MOVEMENT_ASSIST_ENDED_BY_OTHER_UNIT_HOOKS.addSkill(skillId, nodeFunc);
}

/**
 * 生命
 * @param grantsNode
 * @returns {SkillEffectNode}
 * @constructor
 */
const BOOST_3_NODE =
    (grantsNode) => new SkillEffectNode(
        // Grants HP+5.
        // At start of combat,
        // if unit's HP ≥ 50%,
        IF_NODE(new IsUnitsHpGteNPercentAtStartOfCombatNode(50),
            // grants Spd/Res+7 to unit during combat,
            grantsNode,
            // and also,
            // if unit is within 2 spaces of an ally with HP ≥ 50%,
            IF_NODE(new IsTargetWithinNSpacesOfTargetsAllyNode(2, new IsTargetsHpGteNPercentAtStartOfCombatNode(50)),
                // inflicts Special cooldown charge -1 on foe per attack during combat (only highest value applied; does not stack).
                INFLICTS_SPECIAL_COOLDOWN_CHARGE_MINUS_1_ON_FOE_NODE,
            ),
        ),
    );

/// ステータス
const TARGETS_ATK_ON_MAP = new TargetsStatOnMapNode(STATUS_INDEX.Atk);
const TARGETS_SPD_ON_MAP = new TargetsStatOnMapNode(STATUS_INDEX.Spd);
const TARGETS_DEF_ON_MAP = new TargetsStatOnMapNode(STATUS_INDEX.Def);
const TARGETS_RES_ON_MAP = new TargetsStatOnMapNode(STATUS_INDEX.Res);

const TARGETS_EVAL_STAT_ON_MAP = index => new TargetsEvalStatOnMapNode(index);
const TARGETS_EVAL_ATK_ON_MAP = new TargetsEvalStatOnMapNode(STATUS_INDEX.Atk);
const TARGETS_EVAL_SPD_ON_MAP = new TargetsEvalStatOnMapNode(STATUS_INDEX.Spd);
const TARGETS_EVAL_DEF_ON_MAP = new TargetsEvalStatOnMapNode(STATUS_INDEX.Def);
const TARGETS_EVAL_RES_ON_MAP = new TargetsEvalStatOnMapNode(STATUS_INDEX.Res);

const SKILL_OWNERS_ATK_ON_MAP = new SkillOwnersStatOnMapNode(STATUS_INDEX.Atk);
const SKILL_OWNERS_SPD_ON_MAP = new SkillOwnersStatOnMapNode(STATUS_INDEX.Spd);
const SKILL_OWNERS_DEF_ON_MAP = new SkillOwnersStatOnMapNode(STATUS_INDEX.Def);
const SKILL_OWNERS_RES_ON_MAP = new SkillOwnersStatOnMapNode(STATUS_INDEX.Res);

const SKILL_OWNERS_EVAL_ATK_ON_MAP = new SkillOwnersEvalStatOnMapNode(STATUS_INDEX.Atk);
const SKILL_OWNERS_EVAL_SPD_ON_MAP = new SkillOwnersEvalStatOnMapNode(STATUS_INDEX.Spd);
const SKILL_OWNERS_EVAL_DEF_ON_MAP = new SkillOwnersEvalStatOnMapNode(STATUS_INDEX.Def);
const SKILL_OWNERS_EVAL_RES_ON_MAP = new SkillOwnersEvalStatOnMapNode(STATUS_INDEX.Res);

/// 戦闘開始時ステータスの比較
const UNITS_RES_GT_FOES_RES_AT_START_OF_COMBAT_NODE =
    GT_NODE(UNITS_EVAL_RES_AT_START_OF_COMBAT_NODE, FOES_EVAL_RES_AT_START_OF_COMBAT_NODE);
const DIFFERENCE_BETWEEN_RES_STATS_AT_START_OF_COMBAT_NODE =
    SUB_NODE(UNITS_EVAL_RES_AT_START_OF_COMBAT_NODE, FOES_EVAL_RES_AT_START_OF_COMBAT_NODE);

/// 戦闘中ステータスの比較
/**
 * 戦闘中守備が高い
 * @type {GtNode}
 */
const UNITS_DEF_GT_FOES_DEF_DURING_COMBAT_NODE =
    GT_NODE(UNITS_EVAL_DEF_DURING_COMBAT_NODE, FOES_EVAL_DEF_DURING_COMBAT_NODE);
const UNITS_RES_GT_FOES_RES_DURING_COMBAT_NODE =
    GT_NODE(UNITS_EVAL_RES_DURING_COMBAT_NODE, FOES_EVAL_RES_DURING_COMBAT_NODE);

/// 戦闘中ステータスの差
/**
 * 戦闘中の守備の差
 * @type {SubNode}
 */
const DIFFERENCE_BETWEEN_DEF_STATS_NODE =
    SUB_NODE(UNITS_EVAL_DEF_DURING_COMBAT_NODE, FOES_EVAL_DEF_DURING_COMBAT_NODE);
const DIFFERENCE_BETWEEN_RES_STATS_NODE =
    SUB_NODE(UNITS_EVAL_RES_DURING_COMBAT_NODE, FOES_EVAL_RES_DURING_COMBAT_NODE);

/// 強化(バフ)
const FOES_ATK_BONUS_NODE = new FoesBonusNode(STATUS_INDEX.Atk);
const FOES_SPD_BONUS_NODE = new FoesBonusNode(STATUS_INDEX.Spd);
const FOES_DEF_BONUS_NODE = new FoesBonusNode(STATUS_INDEX.Def);
const FOES_RES_BONUS_NODE = new FoesBonusNode(STATUS_INDEX.Res);

const NUM_OF_BONUSES_ACTIVE_ON_TARGET_EXCLUDING_STAT_NODE = new NumOfBonusesActiveOnTargetExcludingStatNode();
const NUM_OF_PENALTIES_ACTIVE_ON_TARGET_EXCLUDING_STAT_NODE = new NumOfPenaltiesActiveOnTargetExcludingStatNode();
const NUM_OF_BONUSES_AND_PENALTIES_ACTIVE_ON_TARGET_EXCLUDING_STAT_NODE =
    SUM_NODE(NUM_OF_BONUSES_ACTIVE_ON_TARGET_EXCLUDING_STAT_NODE, NUM_OF_PENALTIES_ACTIVE_ON_TARGET_EXCLUDING_STAT_NODE);
const BONUSES_ACTIVE_ON_TARGET_EXCLUDING_STAT_SET_NODE = new BonusesActiveOnTargetExcludingStatSetNode();
const PENALTIES_ACTIVE_ON_TARGET_EXCLUDING_STAT_SET_NODE = new PenaltiesActiveOnTargetExcludingStatSetNode();
const BONUSES_AND_PENALTIES_ACTIVE_ON_TARGET_EXCLUDING_STAT_SET_NODE =
    UNION_SET_NODE(BONUSES_ACTIVE_ON_TARGET_EXCLUDING_STAT_SET_NODE, PENALTIES_ACTIVE_ON_TARGET_EXCLUDING_STAT_SET_NODE);

// TODO: 奥義カウント-周りをリファクタリングする(alias以外にも多数クラスが存在)
/**
 * 奥義カウント最大判定
 * if Special cooldown count is at its maximum value grants Special cooldown count-1.
 */
const IS_TARGETS_SPECIAL_COOLDOWN_COUNT_AT_ITS_MAX_AT_START_OF_TURN_NODE =
    EQ_NODE(new TargetsSpecialCountAtStartOfTurnNode(), new TargetsMaxSpecialCountNode());

/**
 * ターン開始時奥義カウントが最大の時にマイナス
 * @param {number|NumberNode} n
 * @returns {IfNode}
 * @constructor
 */
const AT_START_OF_TURN_IF_TARGETS_SPECIAL_COOLDOWN_COUNT_IS_AT_ITS_MAXIMUM_VALUE_GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_X_NODE = n =>
    IF_NODE(IS_TARGETS_SPECIAL_COOLDOWN_COUNT_AT_ITS_MAX_AT_START_OF_TURN_NODE,
        new GrantsSpecialCooldownCountMinusOnTargetAtStartOfTurnNode(n),
    );

/**
 * マップ中奥義カウントが最大の時にマイナス
 * @param {number|NumberNode} n
 * @returns {IfNode}
 * @constructor
 */
const IF_TARGETS_SPECIAL_COOLDOWN_COUNT_IS_AT_ITS_MAXIMUM_VALUE_GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_X_NODE = n =>
    IF_NODE(new IsTargetsSpecialCooldownCountIsAtItsMaximumNode(),
        new GrantsSpecialCooldownCountMinusOnTargetNode(n),
    );

/**
 * 敵の射程が1であるか
 * @type {EqNode}
 */
const FOES_RANGE_IS_1_NODE = EQ_NODE(new FoesRangeNode(), 1);

/**
 * 敵の射程が2であるか
 * @type {EqNode}
 */
const FOES_RANGE_IS_2_NODE = EQ_NODE(new FoesRangeNode(), 2);

const IS_TARGET_BEAST_OR_DRAGON_TYPE_NODE = new IsTargetBeastOrDragonTypeNode();

const IS_TARGET_INFANTRY_NODE = new IsTargetInfantryNode();
const IS_TARGET_ARMOR_NODE = new IsTargetArmorNode();
const IS_FOE_INFANTRY_NODE = new IsFoeInfantryNode();

/**
 * 戦闘中に奥義が発動できない
 * @type {SkillEffectNode}
 */
const FOE_CANNOT_TRIGGER_SPECIALS_DURING_COMBAT_NODE = new SkillEffectNode(
    FOE_CANNOT_TRIGGER_ATTACKER_SPECIAL,
    FOE_CANNOT_TRIGGER_DEFENDER_SPECIAL,
);

/**
 * If unit initiates combat or is within 2 spaces of an ally,
 * @param nodes
 * @returns {IfNode}
 * @constructor
 */
const IF_UNIT_INITIATES_COMBAT_OR_IS_WITHIN_2_SPACES_OF_AN_ALLY = (...nodes) =>
    IF_NODE(OR_NODE(DOES_UNIT_INITIATE_COMBAT_NODE, new IsUnitWithinNSpacesOfUnitsAllyNode(2, TRUE_NODE)), ...nodes);

/**
 * Calculates damage using the lower of foe's Def or Res.
 * @param skillId
 * @constructor
 */
const CALCULATES_DAMAGE_USING_THE_LOWER_OF_FOES_DEF_OR_RES_SKILL = skillId => {
    // TODO: 範囲奥義発動直前のタイミングに変更するか検討する
    BEFORE_AOE_SPECIAL_ACTIVATION_CHECK_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        CALCULATES_DAMAGE_USING_THE_LOWER_OF_FOES_DEF_OR_RES_NODE,
    ));
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        CALCULATES_DAMAGE_USING_THE_LOWER_OF_FOES_DEF_OR_RES_NODE,
    ))
}

/**
 * cavalry with Range = 2
 */
const IS_TARGET_CAVALRY_WITH_RANGE_2_NODE =
    AND_NODE(EQ_NODE(new TargetsMoveTypeNode(), MoveType.Cavalry), EQ_NODE(new TargetsRangeNode(), 2));

/**
 * If foe initiates combat or if foe's HP ≥ 75% at start of combat,
 */
const IF_FOE_INITIATES_COMBAT_OR_IF_FOES_HP_GTE_75_PERCENT_AT_START_OF_COMBAT = (...nodes) =>
    IF_NODE(OR_NODE(DOES_FOE_INITIATE_COMBAT_NODE, IS_FOES_HP_GTE_75_PERCENT_AT_START_OF_COMBAT_NODE), ...nodes);

const DEF_DIFF_DURING_COMBAT_NODE = SUB_NODE(UNITS_DEF_DURING_COMBAT_NODE, FOES_DEF_DURING_COMBAT_NODE);
const RES_DIFF_DURING_COMBAT_NODE = SUB_NODE(UNITS_RES_DURING_COMBAT_NODE, FOES_RES_DURING_COMBAT_NODE);

function setSaveSkill(skillId, isMelee) {
    SAVE_SKILL_SET.add(skillId);
    if (isMelee) {
        CAN_SAVE_FROM_MELEE_SKILL_SET.add(skillId);
    } else {
        CAN_SAVE_FROM_RANGED_SKILL_SET.add(skillId);
    }
}

/**
 * @param skillId
 * @param {boolean} isMelee
 * @param {SkillEffectNode} grantsNode
 */
function setTwinSave(skillId, isMelee, grantsNode) {
    setSaveSkill(skillId, isMelee);

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () =>
        new SkillEffectNode(
            IF_NODE(isMelee ? FOES_RANGE_IS_1_NODE : FOES_RANGE_IS_2_NODE,
                // grants XXX+4 to unit during combat,
                grantsNode,
                // any "reduces damage by X%" effect that can be triggered only once per combat by unit's equipped Special skill can be triggered up to twice per combat (excludes boosted Special effects from engaging; only highest value applied; does not stack),
                new AnyTargetsReduceDamageEffectOnlyOnceCanBeTriggeredUpToNTimesPerCombatNode(1),
                // and restores 7 HP to unit when unit deals damage to foe during combat (triggers even if 0 damage is dealt).
                new WhenTargetDealsDamageDuringCombatRestoresNHPToTargetNode(7),
            ),
        ),
    );
}

function setBriarSave(skillId, isMelee, grantsNode) {
    // If foe with Range = 2 initiates combat against an ally within 2 spaces of unit, triggers【Savior】on unit.
    setSaveSkill(skillId, isMelee);

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () =>
        new SkillEffectNode(
            // If foe's Range = 2,
            IF_NODE(isMelee ? FOES_RANGE_IS_1_NODE : FOES_RANGE_IS_2_NODE,
                // grants Atk/Def+4 to unit and
                grantsNode,
                // reduces damage from foe's first attack by 5 during combat
                // ("first attack" normally means only the first strike; for effects that grant "unit attacks twice," it means the first and second strikes),
                new ReducesDamageFromFoesFirstAttackByNDuringCombatIncludingTwiceNode(5),
                // and unit's next attack deals damage = 40% of foe's attack damage prior to reductions
                // (resets at end of combat; only highest value applied; does not stack).
                TARGETS_NEXT_ATTACK_DEALS_DAMAGE_X_PERCENT_OF_TARGETS_FORES_ATTACK_PRIOR_TO_REDUCTION_ONLY_HIGHEST_VALUE_APPLIED_AND_DOES_NOT_STACK_NODE(40),
            ),
        ),
    );
}

/**
 * Enables【Canto (Rem. +1)】
 */
function enablesCantoRemPlus(skillId, n) {
    CAN_TRIGGER_CANTO_HOOKS.addSkill(skillId, () => TRUE_NODE);
    CALCULATES_DISTANCE_OF_CANTO_HOOKS.addSkill(skillId, () => new CantoRemNode(n));
}

function enablesCantoRemPlusMin(skillId, n, min) {
    CAN_TRIGGER_CANTO_HOOKS.addSkill(skillId, () => TRUE_NODE);
    CALCULATES_DISTANCE_OF_CANTO_HOOKS.addSkill(skillId, () => ENSURE_MIN_NODE(new CantoRemNode(n), 2));
}

/**
 * Enables【Canto (Dist. +1; Max ４)】.
 */
function enablesCantoDist(skillId, n, max) {
    CAN_TRIGGER_CANTO_HOOKS.addSkill(skillId, () => TRUE_NODE);
    CALCULATES_DISTANCE_OF_CANTO_HOOKS.addSkill(skillId, () => new CantoDistNode(n, max));
}

function enablesCantoN(skillId, n) {
    CAN_TRIGGER_CANTO_HOOKS.addSkill(skillId, () => TRUE_NODE);
    CALCULATES_DISTANCE_OF_CANTO_HOOKS.addSkill(skillId, () => new ConstantNumberNode(n));
}

const DEALS_DAMAGE_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS = (percentage, statNode) =>
    new AppliesSkillEffectsAfterStatusFixedNode(
        // deals damage = 20% of unit's Spd (excluding area-of-effect Specials),
        new TargetDealsDamageExcludingAoeSpecialsNode(MULT_TRUNC_NODE(percentage / 100, statNode)),
    );

const REDUCES_DAMAGE_FROM_TARGETS_FOES_ATTACKS_BY_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS_NODE =
    (percentage, statNode) =>
        APPLY_SKILL_EFFECTS_AFTER_STATUS_FIXED_NODE(
            REDUCES_DAMAGE_FROM_TARGETS_FOES_ATTACKS_BY_X_DURING_COMBAT_NODE(
                PERCENTAGE_NODE(percentage, statNode)),
        );

const REDUCES_DAMAGE_FROM_FOES_FIRST_ATTACK_BY_PERCENTAGE_OF_TARGETS_STAT_DURING_COMBAT_INCLUDING_TWICE_NODE =
    (percentage, statNode) =>
        APPLY_SKILL_EFFECTS_AFTER_STATUS_FIXED_NODE(
            // and reduces damage from foe's first attack by 20% of unit's Spd during combat ("first attack" normally means only the first strike; for effects that grant "unit attacks twice," it means the first and second strikes).
            new ReducesDamageFromFoesFirstAttackByNDuringCombatIncludingTwiceNode(
                PERCENTAGE_NODE(percentage, statNode)),
        );

/**
 * @param {number|string} skillId
 * @param {number} beastCommonSkillType
 */
function setBeastSkill(skillId, beastCommonSkillType) {
    WEAPON_TYPES_ADD_ATK2_AFTER_TRANSFORM_SET.add(skillId);
    BEAST_COMMON_SKILL_MAP.set(skillId, beastCommonSkillType);
}

const CALC_POTENTIAL_DAMAGE_NODE = new CalcPotentialDamageNode();

const IS_NOT_TARGET_ADJACENT_TO_AN_ALLY = () =>
    OR_NODE(CALC_POTENTIAL_DAMAGE_NODE, NOT_NODE(GT_NODE(new NumOfTargetsAlliesWithinNSpacesNode(1), 0)));

const NUM_OF_TARGET_ALLIES_ADJACENT_TO_TARGET =
    () => new NumOfTargetsAlliesWithinNSpacesNode(1);

const IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE = (...nodes) =>
    IF_NODE(IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE, ...nodes);

const IF_UNITS_HP_GTE_25_PERCENT_AT_START_OF_TURN_NODE = (...nodes) =>
    IF_NODE(IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_TURN_NODE, ...nodes);

/**
 * Unit can move to any space within 2 spaces of an ally within 2 spaces of unit.
 */
function setSkillThatUnitCanMoveToAnySpaceWithinNSpacesOfAnAllyWithinMSpacesOfUnit(skillId, n, m) {
    UNIT_CAN_MOVE_TO_A_SPACE_HOOKS.addSkill(skillId, () => new UniteSpacesNode(
        new ForEachAllyForSpacesNode(new IsTargetWithinNSpacesOfSkillOwnerNode(m, TRUE_NODE),
            new SkillOwnerPlacableSpacesWithinNSpacesFromSpaceNode(n, TARGETS_PLACED_SPACE_NODE),
        ),
    ));
}

function setSkillThatAlliesWithinNSpacesOfUnitCanMoveToAnySpaceWithinMSpacesOfUnit(skillId, n, m) {
    ALLY_CAN_MOVE_TO_A_SPACE_HOOKS.addSkill(skillId, () =>
        new UniteSpacesIfNode(new IsTargetWithinNSpacesOfSkillOwnerNode(n, TRUE_NODE),
            new TargetsPlacableSpacesWithinNSpacesFromSpaceNode(m, SKILL_OWNERS_PLACED_SPACE_NODE),
        )
    );
}

/**
 * @param {number|NumberNode} n
 * @param {PositiveNumberNode} unitValueNode
 * @returns {NumberNode}
 */
function highestValueAmongTargetAndFoesWithinNSpacesOfTarget(n, unitValueNode) {
    return MAX_NODE(new MapUnitsToNumNode(
        new TargetsAndThoseAlliesWithinNSpacesNode(n, UnitsNode.makeFromUnit(FOE_NODE)),
        unitValueNode,
    ));
}

/**
 * highest total penalties among target and foes within 2 spaces of target
 * @returns {NumberNode}
 */
function highestTotalPenaltiesAmongTargetAndFoesWithinNSpacesOfTarget(n) {
    return highestValueAmongTargetAndFoesWithinNSpacesOfTarget(n, new TargetsTotalPenaltiesNode());
}

/**
 * @param {number|NumberNode} n
 * @param {NumberNode} unitValueNode
 * @returns {NumberNode}
 */
function sumValueAmongTargetAndTargetsAlliesWithinNSpacesOfTarget(n, unitValueNode) {
    return SUM_NODE(new MapUnitsToNumNode(
        new TargetsAndThoseAlliesWithinNSpacesNode(n, UnitsNode.makeFromUnit(FOE_NODE)),
        unitValueNode,
    ));
}

function totalNumberOfBonusesAndPenaltiesActiveOnFoeAndAnyFoeWithinNSpacesOfFoe(n) {
    return sumValueAmongTargetAndTargetsAlliesWithinNSpacesOfTarget(n,
        NUM_OF_BONUSES_AND_PENALTIES_ACTIVE_ON_TARGET_EXCLUDING_STAT_NODE);
}

function setSpecialCount(skillId, n) {
    switch (n) {
        case 2:
            COUNT2_SPECIALS.push(skillId);
            INHERITABLE_COUNT2_SPECIALS.push(skillId);
            break;
        case 3:
            COUNT3_SPECIALS.push(skillId);
            INHERITABLE_COUNT3_SPECIALS.push(skillId);
            break;
        case 4:
            COUNT4_SPECIALS.push(skillId);
            INHERITABLE_COUNT4_SPECIALS.push(skillId);
            break;
    }
}

function setPathfinder(skillId) {
    PATHFINDER_SKILL_SET.add(skillId);
}

const IS_TARGET_SKILL_OWNER_NODE = new IsTargetSkillOwnerNode();
const UNITS_ON_MAP_NODE = new UnitsOnMapNode();
const SKILL_OWNERS_ALLIES_ON_MAP_NODE = FILTER_UNITS_NODE(UNITS_ON_MAP_NODE, ARE_TARGET_AND_SKILL_OWNER_IN_SAME_GROUP_NODE)
const SKILL_OWNERS_FOES_ON_MAP_NODE = FILTER_UNITS_NODE(UNITS_ON_MAP_NODE, NOT_NODE(ARE_TARGET_AND_SKILL_OWNER_IN_SAME_GROUP_NODE))
const SKILL_OWNERS_FOES_HAVE_HIGHEST_VALUE_ON_MAP = func => MAX_UNITS_NODE(SKILL_OWNERS_FOES_ON_MAP_NODE, func);
const SKILL_OWNERS_FOES_HAVE_HIGHEST_AND_THOSE_ALLIES_WITHIN_N_SPACES_ON_MAP = (n, func) =>
    new TargetsAndThoseAlliesWithinNSpacesNode(n, SKILL_OWNERS_FOES_HAVE_HIGHEST_VALUE_ON_MAP(func));
const TARGETS_ALLIES_ON_MAP_NODE = new TargetsAlliesOnMapNode();
const FILTER_MAP_UNITS_NODE = (predNode) => new FilterUnitsNode(UNITS_ON_MAP_NODE, predNode);
const FILTER_TARGETS_ALLIES_NODE = (predNode) => new FilterUnitsNode(TARGETS_ALLIES_ON_MAP_NODE, predNode);
const SKILL_OWNER_AND_SKILL_OWNERS_ALLIES_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_SKILL_OWNER_NODE =
    FILTER_MAP_UNITS_NODE(
        OR_NODE(IS_TARGET_SKILL_OWNER_NODE,
            AND_NODE(
                ARE_TARGET_AND_SKILL_OWNER_IN_SAME_GROUP_NODE,
                IS_TARGET_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_SKILL_OWNER_NODE))
    );

const TARGETS_TOTAL_BONUSES_NODE = new TargetsTotalBonusesNode();
const HIGHEST_TOTAL_BONUSES_AMONG_UNIT_AND_ALLIES_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_UNIT =
    MAX_NODE(new MapUnitsToNumNode(
        SKILL_OWNER_AND_SKILL_OWNERS_ALLIES_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_SKILL_OWNER_NODE,
        TARGETS_TOTAL_BONUSES_NODE));

const HIGHEST_TOTAL_BONUSES_AMONG_UNIT_AND_ALLIES_WITHIN_N_SPACES_NODE = (n) =>
    MAX_NODE(new MapUnitsToNumNode(
        new TargetsAndThoseAlliesWithinNSpacesNode(n, TARGET_NODE),
        TARGETS_TOTAL_BONUSES_NODE));

const TARGETS_BONUSES_NODE = new TargetsBonusesNode();
const HIGHEST_BONUS_ON_EACH_STAT_BETWEEN_TARGET_AND_TARGET_ALLIES_WITHIN_N_SPACES_NODE =
    (n) =>
        new HighestValueOnEachStatAmongUnitsNode(
            new TargetsAndThoseAlliesWithinNSpacesNode(n, TARGET_NODE),
            TARGETS_BONUSES_NODE
        );

const TARGETS_PENALTIES_NODE = new TargetsPenaltiesNode();
const HIGHEST_PENALTIES_ON_EACH_STAT_BETWEEN_TARGET_AND_TARGET_ALLIES_WITHIN_N_SPACES_NODE =
    (n) =>
        new HighestValueOnEachStatAmongUnitsNode(
            new TargetsAndThoseAlliesWithinNSpacesNode(n, FOE_NODE),
            TARGETS_PENALTIES_NODE
        );

const HIGHEST_STATS_ON_EACH_STAT_BETWEEN_TARGET_ALLIES_WITHIN_N_SPACES_NODE =
    (n) =>
        new HighestValueOnEachStatAmongUnitsNode(
            new TargetsAlliesWithinNSpacesNode(n),
            TARGETS_STATS_ON_MAP_NODE,
        );

const TARGETS_PARTNERS_NODE = FILTER_TARGETS_ALLIES_NODE(ARE_TARGET_AND_SKILL_OWNER_PARTNERS_NODE,);

const MAX_UNITS_NODE = (unitsNode, funcNode) => new MaxUnitsNode(unitsNode, funcNode);

const HIGHEST_DEF_ALLIES_ON_MAP_NODE = MAX_UNITS_NODE(TARGETS_ALLIES_ON_MAP_NODE, TARGETS_DEF_ON_MAP);

const HIGHEST_ATK_ALLIES_WITHIN_N_SPACES_NODE =
    n => MAX_UNITS_NODE(TARGETS_ALLIES_WITHIN_N_SPACES_NODE(n), TARGETS_ATK_ON_MAP);
const HIGHEST_ATK_ALLIES_WITHIN_2_SPACES_NODE = HIGHEST_ATK_ALLIES_WITHIN_N_SPACES_NODE(2);

const HIGHEST_HP_AMONG_TARGETS_ALLIES
    = MAX_NODE(MAP_UNITS_TO_NUM_NODE(TARGETS_ALLIES_ON_MAP_NODE, TARGETS_MAX_HP_NODE))

const HIGHEST_HP_AMONG_SKILL_OWNERS_ALLIES
    = MAX_NODE(MAP_UNITS_TO_NUM_NODE(SKILL_OWNERS_ALLIES_ON_MAP_NODE, TARGETS_MAX_HP_NODE))

const IS_BONUS_OR_PENALTY_ACTIVE_ON_TARGET_NODE =
    OR_NODE(new IsBonusActiveOnTargetNode(), new IsPenaltyActiveOnTargetNode());

/**
 * @param {number|NumberNode} n
 * @returns {UnitsNode}
 * @constructor
 */
const ALLIES_WITHIN_N_SPACES_OF_BOTH_ASSIST_UNIT_AND_TARGET = (n) =>
    FILTER_MAP_UNITS_NODE(
        AND_NODE(ARE_TARGET_AND_ASSIST_UNIT_IN_SAME_GROUP_NODE,
            OR_NODE(
                new IsTargetWithinNSpacesOfAssistTargetingNode(n, TRUE_NODE),
                new IsTargetWithinNSpacesOfAssistTargetNode(n, TRUE_NODE)
            ),
        )
    );

/**
 * @param {number|string} skillId
 * @param {[boolean, boolean, boolean, boolean]} neutralizesBonusFlags
 * @param {[number|NumberNode, number|NumberNode, number|NumberNode, number|NumberNode]} bonuses
 */
function setFortune(skillId, neutralizesBonusFlags, bonuses) {
    // If unit can transform,
    // transformation effects gain "if unit is within 2 spaces of a beast or dragon ally,
    // or if number of adjacent allies other than beast or dragon allies ≤ 2" as a trigger condition (in addition to existing conditions).
    CAN_TRANSFORM_AT_START_OF_TURN__HOOKS.addSkill(skillId, () =>
        OR_NODE(
            new IsTargetWithinNSpacesOfTargetsAllyNode(2, IS_TARGET_BEAST_OR_DRAGON_TYPE_NODE),
            LTE_NODE(new NumOfTargetsAlliesWithinNSpacesNode(1, NOT_NODE(IS_TARGET_BEAST_OR_DRAGON_TYPE_NODE)), 2),
        ),
    );

    // If defending in Aether Raids,
    // at the start of enemy turn 1,
    // if conditions for transforming are met,
    // unit transforms.
    CAN_TRANSFORM_AT_START_OF_ENEMY_TURN__HOOKS.addSkill(skillId, () => EQ_NODE(CURRENT_TURN_NODE, 1));

    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit is transformed or if foe initiates combat,
        IF_NODE(OR_NODE(new IsTargetTransformedNode(), DOES_UNIT_INITIATE_COMBAT_NODE),
            // grants Atk/Spd+8 to unit and neutralizes foe's bonuses to Spd/Def during combat,
            new GrantsStatsPlusToUnitDuringCombatNode(StatsNode.makeStatsNodeFrom(...bonuses)),
            new NeutralizesFoesBonusesToStatsDuringCombatNode(...neutralizesBonusFlags),
            // and restores 7 HP to unit after combat.
            RESTORES_7_HP_TO_UNIT_AFTER_COMBAT_NODE,
        ),
    ));
}

function setSlyEffect(skillId, atk, spd, def, res) {
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit initiates combat,
        IF_NODE(DOES_UNIT_INITIATE_COMBAT_NODE,
            // grants Atk/Spd+8 to unit and unit makes a guaranteed follow-up attack during combat,
            new GrantsStatsPlusToTargetDuringCombatNode(atk, spd, def, res),
            UNIT_MAKES_GUARANTEED_FOLLOW_UP_ATTACK_NODE,
            // and also,
            // if number of 【Bonus】effects active on unit ≥ 2, excluding stat bonuses,
            // or if number of 【Penalty】effects active on foe ≥ 2, excluding stat penalties,
            IF_NODE(OR_NODE(
                    GTE_NODE(NUM_OF_BONUSES_ACTIVE_ON_TARGET_EXCLUDING_STAT_NODE, 2),
                    GTE_NODE(NUM_OF_PENALTY_ON_FOE_EXCLUDING_STAT_NODE, 2)
                ),
                // unit deals +5 damage during combat
                new UnitDealsDamageExcludingAoeSpecialsNode(5),
                // (including when dealing damage with an area-of-effect Special; excluding Røkkr area-of-effect Specials).
            ),
        ),
    ));

    BEFORE_AOE_SPECIAL_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        IF_NODE(DOES_UNIT_INITIATE_COMBAT_NODE,
            IF_NODE(OR_NODE(
                    GTE_NODE(NUM_OF_BONUSES_ACTIVE_ON_TARGET_EXCLUDING_STAT_NODE, 2),
                    GTE_NODE(NUM_OF_PENALTY_ON_FOE_EXCLUDING_STAT_NODE, 2)
                ),
                // unit deals +5 damage during combat
                new UnitDealsDamageBeforeCombatNode(5),
                // (including when dealing damage with an area-of-effect Special; excluding Røkkr area-of-effect Specials).
            ),
        ),
    ));
}

// If unit can transform, transformation effects gain "if unit is within 2 spaces of a beast or dragon ally, or if number of adjacent allies other than beast or dragon allies ≤ 2" as a trigger condition (in addition to existing conditions).
function setEffectThatTransformationEffectsGainAdditionalTriggerCondition(skillId) {
    // If unit can transform, transformation effects gain
    CAN_TRANSFORM_AT_START_OF_TURN__HOOKS.addSkill(skillId, () =>
        OR_NODE(
            // "if unit is within 2 spaces of a beast or dragon ally,
            new IsTargetWithinNSpacesOfTargetsAllyNode(2, IS_TARGET_BEAST_OR_DRAGON_TYPE_NODE),
            // or if number of adjacent allies other than beast or dragon allies ≤ 2" as a trigger condition (in addition to existing conditions).
            LTE_NODE(new NumOfTargetsAlliesWithinNSpacesNode(1, NOT_NODE(IS_TARGET_BEAST_OR_DRAGON_TYPE_NODE)), 2),
        ),
    );
}

// If defending in Aether Raids,
// at the start of enemy turn 1,
// if conditions for transforming are met,
// unit transforms.
function setEffectThatIfDefendingInARAtStartOfEnemyTurn1UnitTransforms(skillId) {
    CAN_TRANSFORM_AT_START_OF_ENEMY_TURN__HOOKS.addSkill(skillId, () => EQ_NODE(CURRENT_TURN_NODE, 1));
}

/**
 * the number of foes that have already performed an action
 */
const NUM_OF_TARGETS_FOES_THAT_HAVE_ALREADY_PERFORMED_ACTION =
    COUNT_IF_UNITS_NODE(SKILL_OWNERS_FOES_ON_MAP_NODE, HAS_TARGET_PERFORMED_ACTION_NODE);

/**
 * grants "effective against all weapon types" to unit during combat.
 */
const GRANTS_EFFECTIVE_AGAINST_ALL_WEAPON_TYPES_TO_UNIT_DURING_COMBAT = new SkillEffectNode(
    new EffectiveAgainstNode(EffectiveType.Dragon),
    new EffectiveAgainstNode(EffectiveType.Beast),
    new EffectiveAgainstNode(EffectiveType.Tome),
    new EffectiveAgainstNode(EffectiveType.Sword),
    new EffectiveAgainstNode(EffectiveType.Lance),
    new EffectiveAgainstNode(EffectiveType.Axe),
    new EffectiveAgainstNode(EffectiveType.ColorlessBow),
    new EffectiveAgainstNode(EffectiveType.Staff),
    new EffectiveAgainstNode(EffectiveType.Dagger),
    new EffectiveAgainstNode(EffectiveType.Bow),
);

// TODO: リファクタリング
/**
 * @param {number|string} skillId
 * @param {[number, number, number, number]} buffs
 * @param {number} minHeal
 * @param {number} ratio
 * @param {number[]} statusEffects
 * @param {BoolNode} canRallyForciblyNode
 */
function setRallyHealSkill(skillId, buffs,
                           minHeal = 8, ratio = 0.5, statusEffects = [],
                           canRallyForciblyNode = FALSE_NODE) {
    PRECOMBAT_HEAL_THRESHOLD_MAP.set(skillId, 10);
    getAssistTypeWhenCheckingCanActivatePrecombatAssistFuncMap.set(skillId, _ => AssistType.Heal);
    // このスキルは「応援」として扱われる
    RALLY_HEAL_SKILL_SET.add(skillId);
    // TODO: 検証する。とりあえずプレーヤーなら強制的に応援できる。
    canRallyForciblyByPlayerFuncMap.set(skillId, _ => true);
    // 対象を攻撃のx%回復（最低minHeal）し、
    calcHealAmountFuncMap.set(skillId,
        function (supporterUnit, supportTargetUnit) {
            return MathUtil.ensureMin(Math.trunc(supporterUnit.getAtkInPrecombat() * ratio), minHeal);
        }
    );
    // 対象にbuff
    RALLY_BUFF_AMOUNT_MAP.set(skillId, buffs);
    canAddStatusEffectByRallyFuncMap.set(skillId,
        function (supporterUnit, targetUnit) {
            return statusEffects.some(e => !targetUnit.hasStatusEffect(e));
        }
    );
    canRallyForciblyFuncMap.set(skillId,
        function (unit) {
            let env = new NodeEnv().setBattleMap(g_appData.map).setTarget(unit).setSkillOwner(unit)
                .setSkillOwner(unit).setName('強制応援可能判定').setLogLevel(getSkillLogLevel());
            return canRallyForciblyNode.evaluate(env);
        }
    );
    // （このスキル使用時の奥義発動カウント変動量は常に0、経験値、SPも入手できない）
    NO_EFFECT_ON_SPECIAL_COOLDOWN_CHARGE_ON_SUPPORT_SKILL_SET.add(skillId);
}

function setSpikedWall(skillId, debuffAmounts, statuses) {
    // Foes with Range = 1 cannot move through spaces adjacent to unit (does not affect foes with Pass skills).
    // Foes with Range = 2 cannot move through spaces within 2 spaces of unit (does not affect foes with Pass skills).
    CANNOT_FOE_MOVE_THROUGH_SPACES_ADJACENT_TO_UNIT_HOOKS.addSkill(skillId, () => TRUE_NODE);
    CANNOT_FOE_MOVE_THROUGH_SPACES_WITHIN_2_SPACES_OF_UNIT_HOOKS.addSkill(skillId, () =>
        EQ_NODE(new TargetsRangeNode(), 2),
    )
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // Inflicts Atk/Def-4 on foe,
        new InflictsStatsMinusOnFoeDuringCombatNode(...debuffAmounts),
        new AppliesSkillEffectsAfterStatusFixedNode(
            // deals damage = 15% of the greater of unit's Def or Res (excluding area-of-effect Specials),
            new UnitDealsDamageExcludingAoeSpecialsNode(
                MULT_TRUNC_NODE(0.15, MAX_NODE(...statuses)),
            ),
        ),
        // reduces damage from foe's first attack by 7
        new ReducesDamageFromFoesFirstAttackByNDuringCombatIncludingTwiceNode(7),
        // ("first attack" normally means only the first strike; for effects that grant "unit attacks twice," it means the first and second strikes),
        // and neutralizes effects that inflict "Special cooldown charge -X" on unit during combat.
        NEUTRALIZES_EFFECTS_THAT_INFLICT_SPECIAL_COOLDOWN_CHARGE_MINUS_X_ON_UNIT,
    ));
}

/**
 * total of the number of distinct game titles among allies
 */
const TOTAL_OF_THE_NUMBER_OF_DISTINCT_GAME_TITLES_AMONG_UNITS_NODE =
    units => SET_SIZE_NODE(MAP_UNION_UNITS_NODE(units, TARGETS_TITLE_SET_NODE));

/**
 * number of distinct game titles among allies within 3 spaces of unit
 */
const NUMBER_OF_DISTINCT_GAME_TITLES_AMONG_ALLIES_WITHIN_3_SPACES_OF_UNIT_NODE =
    n => TOTAL_OF_THE_NUMBER_OF_DISTINCT_GAME_TITLES_AMONG_UNITS_NODE(TARGETS_ALLIES_WITHIN_N_SPACES_NODE(n));

/**
 * @param skillId
 * @param {NumberNode[]} statsNodes
 */
function setSway(skillId, statsNodes) {
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // If unit initiates combat or is within 3 spaces of an ally,
        IF_NODE(OR_NODE(DOES_UNIT_INITIATE_COMBAT_NODE, IS_TARGET_WITHIN_3_SPACES_OF_TARGETS_ALLY_NODE),
            X_NUM_NODE(
                // grants bonus to unit's Atk/Res during combat = 8 + number of allies within 3 spaces of unit × 2 (max 12),
                GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE(...statsNodes),
                ENSURE_MAX_NODE(ADD_NODE(8, MULT_NODE(NUM_OF_TARGETS_ALLIES_WITHIN_3_SPACES_NODE, 2)), 12),
            ),
            // and calculates damage from staff like other weapons.
            CALCULATES_TARGETS_DAMAGE_FROM_STAFF_LIKE_OTHER_WEAPONS_NODE,
        ),
    ));
}

function setCannotMoveThroughSpacesSkill(skillId) {
    // Foes with Range = 1 cannot move through spaces adjacent to unit (does not affect foes with Pass skills).
    // Foes with Range = 2 cannot move through spaces within 2 spaces of unit (does not affect foes with Pass skills).
    CANNOT_FOE_MOVE_THROUGH_SPACES_ADJACENT_TO_UNIT_HOOKS.addSkill(skillId, () => TRUE_NODE);
    CANNOT_FOE_MOVE_THROUGH_SPACES_WITHIN_2_SPACES_OF_UNIT_HOOKS.addSkill(skillId, () => TRUE_NODE);
}

/**
 * 魔防+5比較の竜眼
 * @type {AppliesSkillEffectsAfterStatusFixedNode}
 */
const INFLICTS_SPECIAL_COOLDOWN_COUNT_1_ON_FOE_BEFORE_FOES_FIRST_ATTACK_DURING_COMBAT_BY_DRAGON_NODE =
    APPLY_SKILL_EFFECTS_AFTER_STATUS_FIXED_NODE(
        // if foe's attack can trigger foe's Special and unit's Res ≥ foe's Res+5,
        IF_NODE(
            AND_NODE(
                CAN_FOES_ATTACK_TRIGGER_FOES_SPECIAL_NODE,
                GTE_NODE(UNITS_EVAL_RES_DURING_COMBAT_NODE, ADD_NODE(5, FOES_EVAL_RES_DURING_COMBAT_NODE))
            ),
            // inflicts Special cooldown count+1 on foe before foe's first attack during combat (cannot exceed the foe's maximum Special cooldown).
            INFLICTS_SPECIAL_COOLDOWN_COUNT_PLUS_N_ON_FOE_BEFORE_FOES_FIRST_ATTACK(1),
        ),
    );

function grantsAnotherActionAfterCanto(skillId) {
    // After Canto,
    AFTER_CANTO_HOOKS.addSkill(skillId, () => new SkillEffectNode(
        // if unit entered combat on the current turn,
        IF_NODE(HAS_TARGET_ENTERED_COMBAT_DURING_CURRENT_TURN_NODE,
            // grants another action to unit,
            TARGETS_ONCE_PER_TURN_SKILL_EFFECT_NODE(
                `${skillId}-再移動後再起動`,
                // and re-enables Canto (once per turn; does not trigger when affected by effects of traps in Aether Raids during Canto).
                // TODO: 移動中に行動終了した = 罠を踏んだの全体が崩れた時に修正する
                IF_NODE(NOT_NODE(IS_TARGET_ACTION_DONE_DURING_MOVE_COMMAND_NODE),
                    GRANTS_ANOTHER_ACTION_TO_TARGET_ON_MAP_NODE,
                    RE_ENABLES_CANTO_TO_TARGET_ON_MAP_NODE,
                ),
            ),
        ),
    ));
}
