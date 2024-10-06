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

/**
 * 戦闘中守備が高い
 * @type {GtNode}
 */
const UNITS_DEF_GT_FOES_DEF_NODE = GT_NODE(UNITS_EVAL_DEF_DURING_COMBAT_NODE, FOES_EVAL_DEF_DURING_COMBAT_NODE);

/**
 * 戦闘中の守備の差
 * @type {SubNode}
 */
const DIFFERENCE_BETWEEN_DEF_STATS_NODE =
    SUB_NODE(UNITS_EVAL_DEF_DURING_COMBAT_NODE, FOES_EVAL_DEF_DURING_COMBAT_NODE);

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
 * 敵の射程が2であるか
 * @type {EqNode}
 */
const FOES_RANGE_IS_2_NODE = EQ_NODE(new FoesRangeNode(), 2);

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
const IF_FOE_INITIATES_COMBAT_OR_IF_FOES_HP_GTE_75_AT_START_OF_COMBAT = (...nodes) =>
    IF_NODE(OR_NODE(DOES_FOE_INITIATE_COMBAT_NODE, IS_FOES_HP_GTE_75_PERCENT_AT_START_OF_COMBAT_NODE), ...nodes);

const DEF_DIFF_DURING_COMBAT_NODE = SUB_NODE(UNITS_DEF_DURING_COMBAT_NODE, FOES_DEF_DURING_COMBAT_NODE);
const RES_DIFF_DURING_COMBAT_NODE = SUB_NODE(UNITS_RES_DURING_COMBAT_NODE, FOES_RES_DURING_COMBAT_NODE);
