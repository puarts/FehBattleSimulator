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