class CustomSkill {
    static OPTIONS = [];

    /**
     * @type {[NumberNode, string][]}
     */
    static STAT_NODE_LIST = [];

    static {
        /**
         * カスタムスキルのオプション。idはfuncId
         */
        this.OPTIONS.push({id: '', text: '-- カスタムスキルを選択 --', disabled: true});
        this.OPTIONS.push({id: NONE_ID, text: "なし"});

    }
    /**
     * funcIdから動的スキル登録を行う関数のマップ
     * @type {Map<string, function(number|string, Object)>}
     */
    static FUNC_MAP = new Map();

    /**
     * 動的に登録済みのスキルIDの集合
     * @type {Set<any>}
     */
    static registeredSkillIds = new Set();

    static Arg = class {
        static Node = {
            NON_NEGATIVE_INTEGER: "non_negative_integer",
            CONST_VALUE: "const_value",
            PLUS: "plus",
            VARIABLE: "variable",
            VARIABLE_PERCENTAGE: "variable_percentage",
            PERCENTAGE: "percentage",
            EFFECTIVE_TYPE: "effective_type",
            STATUS_EFFECT_TYPE: "status_effect_type",
            STAT: "stat",
        }

        static NodeType = {
            INTEGER: "integer",
            NON_NEGATIVE_INTEGER: "non_negative_integer",
            PERCENTAGE: "percentage",
            ID: "id",
            SKILL_ID: "skill_id",
            OPERATION: "operation",
        }

        static NODE_TYPE_BY_NODE = new Map([
            [this.Node.NON_NEGATIVE_INTEGER, this.NodeType.NON_NEGATIVE_INTEGER],
            [this.Node.CONST_VALUE, this.NodeType.INTEGER],
            [this.Node.PLUS, this.NodeType.OPERATION],
            [this.Node.VARIABLE, this.NodeType.INTEGER],
            [this.Node.VARIABLE_PERCENTAGE, this.NodeType.PERCENTAGE],
            [this.Node.PERCENTAGE, this.NodeType.PERCENTAGE],
            [this.Node.EFFECTIVE_TYPE, this.NodeType.ID],
            [this.Node.STATUS_EFFECT_TYPE, this.NodeType.ID],
            [this.Node.STAT, this.NodeType.ID],
        ]);

        /**
         * @type {MultiValueMap<string, string>}
         */
        static NODES_BY_FUNC_ID = new MultiValueMap();

        /**
         * @type {MultiValueMap<string, Object>}
         */
        static OPTIONS_BY_NODE = new MultiValueMap();

        static getNodeType(node) {
            return this.NODE_TYPE_BY_NODE.get(node);
        }

        static getNonNegativeIntegerNode(args) {
            return NumberNode.makeNumberNodeFrom(args[this.Node.NON_NEGATIVE_INTEGER] ?? 0);
        }

        static getPercentageNode(args) {
            return NumberNode.makeNumberNodeFrom(args[this.Node.PERCENTAGE] ?? 0);
        }

        static getStatNode(args) {
            let id = args[this.Node.STAT];
            return id ? CustomSkill.STAT_NODE_LIST[id][0] : ZERO_NUMBER_NODE;
        }

        static getStatPercentNode(args) {
            return PERCENTAGE_NODE(this.getPercentageNode(args), this.getStatNode(args));
        }
    }

    /**
     * @type {Map<string, string>}
     */
    static NAME_BY_FUNC_ID = new Map();

    /// カスタムスキル関数
    // 特効
    /**
     * @param {string} funcId
     * @param {string} text
     * @param {function((number|string), Object)} func
     * @param {string[]} args
     */
    static setFuncId(funcId, text, func, args) {
        this.OPTIONS.push({id: funcId, text: text});
        // 関数登録
        this.FUNC_MAP.set(funcId, func);
        // 名前登録
        this.NAME_BY_FUNC_ID.set(funcId, text);
        // 引数設定
        for (let arg of args) {
            this.Arg.NODES_BY_FUNC_ID.addValue(funcId, arg);
        }
    }
}

CustomSkill.Arg.STAT_NODE_LIST = [
    [ZERO_NUMBER_NODE, '選択してください'],
    [UNITS_ATK_AT_START_OF_COMBAT_NODE, '戦闘開始時の攻撃'],
    [UNITS_SPD_AT_START_OF_COMBAT_NODE, '戦闘開始時の速さ'],
    [UNITS_DEF_AT_START_OF_COMBAT_NODE, '戦闘開始時の守備'],
    [UNITS_RES_AT_START_OF_COMBAT_NODE, '戦闘開始時の魔防'],

    [FOES_ATK_AT_START_OF_COMBAT_NODE, '戦闘開始時の敵の攻撃'],
    [FOES_SPD_AT_START_OF_COMBAT_NODE, '戦闘開始時の敵の速さ'],
    [FOES_DEF_AT_START_OF_COMBAT_NODE, '戦闘開始時の敵の守備'],
    [FOES_RES_AT_START_OF_COMBAT_NODE, '戦闘開始時の敵の魔防'],

    [UNITS_ATK_NODE, '攻撃'],
    [UNITS_SPD_NODE, '速さ'],
    [UNITS_DEF_NODE, '守備'],
    [UNITS_RES_NODE, '魔防'],

    [FOES_ATK_NODE, '敵の攻撃'],
    [FOES_SPD_NODE, '敵の速さ'],
    [FOES_DEF_NODE, '敵の守備'],
    [FOES_RES_NODE, '敵の魔防'],
];

for (let [index, [_node, text]] of CustomSkill.Arg.STAT_NODE_LIST.entries()) {
    let option = {id: index, text};
    if (index === 0) {
        option.id = "";
        option.disabled = true;
    }
    CustomSkill.Arg.OPTIONS_BY_NODE.addValue(CustomSkill.Arg.Node.STAT, option);
}

// 特効タイプ
for (let [_key, value] of Object.entries(EffectiveType)) {
    let option = value === EffectiveType.None ?
        {id: '', text: '選択してください', disabled: true} :
        {id: value, text: EFFECTIVE_TYPE_NAMES.get(value)};
    CustomSkill.Arg.OPTIONS_BY_NODE.addValue(CustomSkill.Arg.Node.EFFECTIVE_TYPE, option);
}

// ステータス状態
for (let [_key, value] of Object.entries(StatusEffectType)) {
    let option = value === StatusEffectType.None ?
        {id: '', text: '選択してください', disabled: true} :
        {id: value, text: STATUS_EFFECT_INFO_MAP.get(value)[1]};
    CustomSkill.Arg.OPTIONS_BY_NODE.addValue(CustomSkill.Arg.Node.STATUS_EFFECT_TYPE, option);
}

// setFuncId('XXX', "YYY",
//     (skillId, args) => {
//     },
//     [
//     ],
// );

CustomSkill.setFuncId('deals-damage-excluding-aoe', "ダメージ+（範囲除）",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkillIfAbsent(skillId, () =>
            DEALS_DAMAGE_X_NODE(CustomSkill.Arg.getNonNegativeIntegerNode(args))
        );
    },
    [
        CustomSkill.Arg.Node.NON_NEGATIVE_INTEGER,
    ],
);

CustomSkill.setFuncId('reduces-damage-excluding-aoe', "ダメージ-（範囲除）",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkillIfAbsent(skillId, () =>
            REDUCES_DAMAGE_BY_N_NODE(CustomSkill.Arg.getNonNegativeIntegerNode(args))
        );
    },
    [
        CustomSkill.Arg.Node.NON_NEGATIVE_INTEGER,
    ],
);

CustomSkill.setFuncId('reduces-damage-from-special-excluding-aoe', "奥義ダメージ-（範囲除）",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkillIfAbsent(skillId, () =>
            REDUCES_DAMAGE_WHEN_FOES_SPECIAL_EXCLUDING_AOE_SPECIAL_NODE(
                CustomSkill.Arg.getNonNegativeIntegerNode(args)
            ),
        );
    },
    [
        CustomSkill.Arg.Node.NON_NEGATIVE_INTEGER,
    ],
);

CustomSkill.setFuncId('reduces-damage-by-x-percent-excluding-aoe', "ダメージ軽減（範囲除）",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkillIfAbsent(skillId, () =>
            REDUCES_DAMAGE_FROM_TARGETS_FOES_ATTACKS_BY_X_PERCENT_DURING_COMBAT_NODE(
                CustomSkill.Arg.getPercentageNode(args)
            ),
        );
    },
    [
        CustomSkill.Arg.Node.PERCENTAGE,
    ],
);

CustomSkill.setFuncId('reduces-damage-by-x-percent-by-special-excluding-aoe', "ダメージ軽減（奥義扱、範囲除）",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkillIfAbsent(skillId, () =>
            REDUCES_DAMAGE_FROM_TARGETS_FOES_ATTACKS_BY_X_PERCENT_BY_SPECIAL_NODE(
                CustomSkill.Arg.getPercentageNode(args)
            ),
        );
    },
    [
        CustomSkill.Arg.Node.PERCENTAGE,
    ],
);

CustomSkill.setFuncId('deals-damage-stat-percent-excluding-aoe', "ダメージ+ステータスのn%（範囲除）",
    (skillId, args) => {
        WHEN_APPLIES_EFFECTS_AFTER_COMBAT_STATS_DETERMINED_HOOKS.addSkillIfAbsent(skillId, () =>
            DEALS_DAMAGE_X_NODE(
                CustomSkill.Arg.getStatPercentNode(args)
            ),
        );
    },
    [
        CustomSkill.Arg.Node.STAT,
        CustomSkill.Arg.Node.PERCENTAGE,
    ],
);

// 特効
CustomSkill.setFuncId('effective-against', "特効",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkillIfAbsent(skillId, () => SKILL_EFFECT_NODE(
            EFFECTIVE_AGAINST_NODE(args[CustomSkill.Arg.Node.EFFECTIVE_TYPE] ?? EffectiveType.None),
        ));
    },
    [
        CustomSkill.Arg.Node.EFFECTIVE_TYPE,
    ],
);

// 特効無効
CustomSkill.setFuncId('neutralizes-effective-against-bonuses', "特効無効",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
            // Neutralizes "effective against" bonuses for all movement types.
            TARGET_NEUTRALIZES_EFFECTIVE_AGAINST_X_NODE(
                args[CustomSkill.Arg.Node.EFFECTIVE_TYPE] ?? EffectiveType.None
            ),
        ));
    },
    [
        CustomSkill.Arg.Node.EFFECTIVE_TYPE,
    ],
);

CustomSkill.setFuncId('reflex-foes-first-attack-damage', "最初の攻撃のダメージのn%を反射",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkillIfAbsent(skillId, () => SKILL_EFFECT_NODE(
            TARGETS_NEXT_ATTACK_DEALS_DAMAGE_X_PERCENT_OF_TARGETS_FORES_ATTACK_PRIOR_TO_REDUCTION_ONLY_HIGHEST_VALUE_APPLIED_AND_DOES_NOT_STACK_NODE(
                args[CustomSkill.Arg.Node.PERCENTAGE] ?? 0,
            ),
        ));
    },
    [
        CustomSkill.Arg.Node.PERCENTAGE,
    ],
);

CustomSkill.setFuncId('restore-n-hp-after-combat', "戦闘後、n回復",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkillIfAbsent(skillId, () => SKILL_EFFECT_NODE(
            RESTORES_N_HP_TO_UNIT_AFTER_COMBAT_NODE(args[CustomSkill.Arg.Node.NON_NEGATIVE_INTEGER] ?? 0),
        ));
    },
    [
        CustomSkill.Arg.Node.NON_NEGATIVE_INTEGER,
    ],
);

CustomSkill.setFuncId('when-deals-damage-restores-n-hp', "攻撃でダメージを与えたとき、n回復",
    (skillId, args) => {
        AT_START_OF_ATTACK_HOOKS.addSkillIfAbsent(skillId, () => SKILL_EFFECT_NODE(
            WHEN_TARGET_DEALS_DAMAGE_DURING_COMBAT_RESTORES_N_HP_PER_ATTACK_TO_TARGET_NODE(
                args(CustomSkill.Arg.Node.NON_NEGATIVE_INTEGER) ?? 0
            ),
        ));
    },
    [
        CustomSkill.Arg.Node.NON_NEGATIVE_INTEGER,
    ],
);

CustomSkill.setFuncId('reduce-deep-wounds-by-n-percent-during-combat', "回復不可をn%無効",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkillIfAbsent(skillId, () => SKILL_EFFECT_NODE(
            REDUCES_EFFECT_OF_DEEP_WOUNDS_ON_TARGET_BY_X_PERCENT_DURING_COMBAT_NODE(
                args(CustomSkill.Arg.Node.PERCENTAGE) ?? 0,
            ),
        ));
    },
    [
        CustomSkill.Arg.Node.PERCENTAGE,
    ],
);

// setFuncId('XXX', "YYY",
//     (skillId, args) => {
//     },
//     [
//     ],
// );

/// 引数
// // オブジェクトから選択するタイプの引数。XXX, YYY, ZZZを変更
// for (let [_key, value] of Object.entries(XXX)) {
//     let option = value === XXX.None ?
//         {id: '', text: '選択してください', disabled: true} :
//         {id: value, text: YYY};
//     ARG_TYPE_TO_OPTIONS_MAP.addValue(CustomSkill.Arg.Node.ZZZ, option);
// }

{
    let funcId = 'accelerates-special-trigger-cooldown-count–1';
    let skillId = getCustomSkillId(funcId, {});
    CustomSkill.OPTIONS.push({id: funcId, text: "奥義が発動しやすい（最低1）"});
    ACCELERATES_SPECIAL_TRIGGER_SET.add(skillId);
}

{
    let funcId = 'reflex-foes-first-attack';
    let skillId = getCustomSkillId(funcId, {});
    CustomSkill.OPTIONS.push({id: funcId, text: "最初の攻撃を反射"});
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        TARGETS_NEXT_ATTACK_DEALS_DAMAGE_EQ_TOTAL_DAMAGE_REDUCED_FROM_TARGETS_FOES_FIRST_ATTACK_NODE,
    ));
}

/// 祈り
{
    let funcId = 'non-special-miracle';
    let skillId = getCustomSkillId(funcId, {});
    CustomSkill.OPTIONS.push({id: funcId, text: "奥義以外の祈り"});
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        TARGET_CAN_ACTIVATE_NON_SPECIAL_MIRACLE_NODE(0),
    ));
}

{
    let funcId = 'neutralizes-foes-non-special-miracle';
    let skillId = getCustomSkillId(funcId, {});
    CustomSkill.OPTIONS.push({id: funcId, text: "奥義以外の祈り無効"});
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        NEUTRALIZES_TARGET_FOES_NON_SPECIAL_MIRACLE,
    ));
}

/// 竜眼
{
    let funcId = 'unconditional-scowl';
    let skillId = getCustomSkillId(funcId, {});
    CustomSkill.OPTIONS.push({id: funcId, text: "無条件竜眼"});
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        INFLICTS_SPECIAL_COOLDOWN_COUNT_PLUS_N_ON_TARGETS_FOE_BEFORE_TARGETS_FOES_FIRST_ATTACK_NODE(1),
    ));
}

{
    let funcId = 'conditional-scowl';
    let skillId = getCustomSkillId(funcId, {});
    CustomSkill.OPTIONS.push({id: funcId, text: "竜眼（相手攻撃奥義+魔防比較あり）"});
    WHEN_APPLIES_EFFECTS_AFTER_COMBAT_STATS_DETERMINED_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        IF_NODE(
            AND_NODE(
                CAN_FOES_ATTACK_TRIGGER_FOES_SPECIAL_NODE,
                GTE_NODE(UNITS_EVAL_RES_DURING_COMBAT_NODE, ADD_NODE(5, FOES_EVAL_RES_DURING_COMBAT_NODE))
            ),
            INFLICTS_SPECIAL_COOLDOWN_COUNT_PLUS_N_ON_TARGETS_FOE_BEFORE_TARGETS_FOES_FIRST_ATTACK_NODE(1),
        ),
    ));
}

/// 奥義カウント
{
    let funcId = 'inflicts-special-charge-1-on-foe';
    let skillId = getCustomSkillId(funcId, {});
    CustomSkill.OPTIONS.push({id: funcId, text: "敵の奥義発動カウント変動量-1"});
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        INFLICTS_SPECIAL_COOLDOWN_CHARGE_MINUS_1_ON_FOE_NODE,
    ));
}

{
    let funcId = 'grants-special-charge-1-to-unit-per-attack';
    let skillId = getCustomSkillId(funcId, {});
    CustomSkill.OPTIONS.push({id: funcId, text: "戦闘中、自身の奥義発動カウント変動量+1"});
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        GRANTS_SPECIAL_COOLDOWN_CHARGE_PLUS_1_TO_UNIT_PER_ATTACK_DURING_COMBAT_NODE,
    ));
}

{
    let funcId = 'neutralizes-special-charge-plus-to-foe';
    let skillId = getCustomSkillId(funcId, {});
    CustomSkill.OPTIONS.push({id: funcId, text: "敵の奥義発動カウント変動量+を無効"});
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        NEUTRALIZES_EFFECTS_THAT_GRANT_SPECIAL_COOLDOWN_CHARGE_PLUS_X_TO_FOE,
    ));
}

{
    let funcId = 'neutralizes-special-charge-minus-on-unit';
    let skillId = getCustomSkillId(funcId, {});
    CustomSkill.OPTIONS.push({id: funcId, text: "自身の奥義発動カウント変動量-を無効"});
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        NEUTRALIZES_EFFECTS_THAT_INFLICT_SPECIAL_COOLDOWN_CHARGE_MINUS_X_ON_UNIT,
    ));
}

{
    let funcId = 'tempo';
    let skillId = getCustomSkillId(funcId, {});
    CustomSkill.OPTIONS.push({id: funcId, text: "拍節"});
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        NEUTRALIZES_EFFECTS_THAT_GRANT_SPECIAL_COOLDOWN_CHARGE_PLUS_X_TO_FOE,
        NEUTRALIZES_EFFECTS_THAT_INFLICT_SPECIAL_COOLDOWN_CHARGE_MINUS_X_ON_UNIT,
    ));
}

/// 追撃
{
    let funcId = 'makes-guaranteed-follow-up-attack';
    let skillId = getCustomSkillId(funcId, {});
    CustomSkill.OPTIONS.push({id: funcId, text: "絶対追撃"});
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        UNIT_MAKES_GUARANTEED_FOLLOW_UP_ATTACK_NODE,
    ));
}

{
    let funcId = 'foe-cannot-make-follow-up-attack';
    let skillId = getCustomSkillId(funcId, {});
    CustomSkill.OPTIONS.push({id: funcId, text: "敵は追撃不可"});
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        FOE_CANNOT_MAKE_FOLLOW_UP_ATTACK_NODE,
    ));
}

{
    let funcId = 'neutralizes-guarantee-foes-follow-up-attack';
    let skillId = getCustomSkillId(funcId, {});
    CustomSkill.OPTIONS.push({id: funcId, text: "敵の絶対追撃を無効"});
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        UNIT_NEUTRALIZES_EFFECTS_THAT_GUARANTEE_FOES_FOLLOW_UP_ATTACKS_DURING_COMBAT_NODE,
    ));
}

{
    let funcId = 'neutralizes-prevent-follow-up-attack';
    let skillId = getCustomSkillId(funcId, {});
    CustomSkill.OPTIONS.push({id: funcId, text: "自身の追撃不可を無効"});
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        UNIT_NEUTRALIZES_EFFECTS_THAT_PREVENT_UNITS_FOLLOW_UP_ATTACKS_DURING_COMBAT,
    ));
}

/// 反撃
{
    let funcId = 'foe-cannot-counterattack';
    let skillId = getCustomSkillId(funcId, {});
    CustomSkill.OPTIONS.push({id: funcId, text: "敵は反撃不可"});
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        FOE_CANNOT_COUNTERATTACK_NODE,
    ));
}

{
    let funcId = 'neutralizes-prevent-counterattack';
    let skillId = getCustomSkillId(funcId, {});
    CustomSkill.OPTIONS.push({id: funcId, text: "自身の反撃不可を無効"});
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        NEUTRALIZES_EFFECTS_THAT_PREVENT_TARGETS_COUNTERATTACKS_DURING_COMBAT_NODE,
    ));
}

/// 攻撃順序
{
    let funcId = 'can-make-follow-up-attack-before-foes-next-attack';
    let skillId = getCustomSkillId(funcId, {});
    CustomSkill.OPTIONS.push({id: funcId, text: "攻め立て"});
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        UNIT_CAN_MAKE_FOLLOW_UP_ATTACK_BEFORE_FOES_NEXT_ATTACK_NODE,
    ));
}

{
    let funcId = 'counterattack-before-foes-first-attack';
    let skillId = getCustomSkillId(funcId, {});
    CustomSkill.OPTIONS.push({id: funcId, text: "先制攻撃（待ち伏せ）"});
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        TARGET_CAN_COUNTERATTACK_BEFORE_TARGETS_FOES_FIRST_ATTACK_NODE,
    ));
}

/// 2回攻撃
{
    let funcId = 'attacks-twice-when-initiates-combat';
    let skillId = getCustomSkillId(funcId, {});
    CustomSkill.OPTIONS.push({id: funcId, text: "攻撃時、2回攻撃"});
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        TARGET_ATTACKS_TWICE_WHEN_TARGET_INITIATES_COMBAT_NODE,
    ));
}

{
    let funcId = 'attacks-twice-when-foe-initiates-combat';
    let skillId = getCustomSkillId(funcId, {});
    CustomSkill.OPTIONS.push({id: funcId, text: "攻撃された時、2回攻撃"});
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        TARGET_ATTACKS_TWICE_WHEN_TARGETS_FOE_INITIATES_COMBAT_NODE,
    ));
}

{
    let funcId = 'attacks-twice-even-if-foe-initiates-combat';
    let skillId = getCustomSkillId(funcId, {});
    CustomSkill.OPTIONS.push({id: funcId, text: "2回攻撃（受けの時も2回攻撃）"});
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        TARGET_ATTACKS_TWICE_EVEN_IF_TARGETS_FOE_INITIATES_COMBAT_NODE,
    ));
}

/// 移動
{
    let funcId = 'can-move-through-foes-spaces';
    let skillId = getCustomSkillId(funcId, {});
    CustomSkill.OPTIONS.push({id: funcId, text: "すり抜け"});
    CAN_MOVE_THROUGH_FOES_SPACE_SKILL_SET.add(skillId);
}

/// 奥義発動
{
    let funcId = 'prevent-a-special-during-combat';
    let skillId = getCustomSkillId(funcId, {});
    CustomSkill.OPTIONS.push({id: funcId, text: "戦闘中、敵は攻撃奥義を発動できない"});
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        FOE_CANNOT_TRIGGER_ATTACKER_SPECIAL,
    ));
}

{
    let funcId = 'foe-prevent-a-special-during-combat';
    let skillId = getCustomSkillId(funcId, {});
    CustomSkill.OPTIONS.push({id: funcId, text: "戦闘中、自分は攻撃奥義を発動できない"});
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        UNIT_CANNOT_TRIGGER_ATTACKER_SPECIAL,
    ));
}

{
    let funcId = 'prevent-d-special-during-combat';
    let skillId = getCustomSkillId(funcId, {});
    CustomSkill.OPTIONS.push({id: funcId, text: "戦闘中、敵は防御奥義を発動できない"});
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        FOE_CANNOT_TRIGGER_DEFENDER_SPECIAL,
    ));
}

{
    let funcId = 'foe-prevent-d-special-during-combat';
    let skillId = getCustomSkillId(funcId, {});
    CustomSkill.OPTIONS.push({id: funcId, text: "戦闘中、自分は防御奥義を発動できない"});
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        UNIT_CANNOT_TRIGGER_DEFENDER_SPECIAL,
    ));
}

{
    let funcId = 'prevent-special-during-combat';
    let skillId = getCustomSkillId(funcId, {});
    CustomSkill.OPTIONS.push({id: funcId, text: "戦闘中、敵は奥義を発動できない"});
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        FOE_CANNOT_TRIGGER_SPECIALS_DURING_COMBAT_NODE,
    ));
}

{
    let funcId = 'foe-prevent-special-during-combat';
    let skillId = getCustomSkillId(funcId, {});
    CustomSkill.OPTIONS.push({id: funcId, text: "戦闘中、自分は奥義を発動できない"});
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        UNIT_CANNOT_TRIGGER_SPECIALS_DURING_COMBAT_NODE,
    ));
}

{
    let funcId = 'prevent-aoe-special';
    let skillId = getCustomSkillId(funcId, {});
    CustomSkill.OPTIONS.push({id: funcId, text: "敵は範囲奥義を発動できない"});
    BEFORE_AOE_SPECIAL_ACTIVATION_CHECK_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        FOE_CANNOT_TRIGGER_AREA_OF_EFFECT_SPECIALS_NODE,
    ));
}

{
    let funcId = 'foe-prevent-aoe-special';
    let skillId = getCustomSkillId(funcId, {});
    CustomSkill.OPTIONS.push({id: funcId, text: "自分は範囲奥義を発動できない"});
    BEFORE_AOE_SPECIAL_ACTIVATION_CHECK_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        UNIT_CANNOT_TRIGGER_AREA_OF_EFFECT_SPECIALS_NODE,
    ));
}

/// 攻撃前の奥義カウント変動
{
    let funcId = 'grants-special-count-before-first-attack';
    let skillId = getCustomSkillId(funcId, {});
    CustomSkill.OPTIONS.push({id: funcId, text: "自分の最初の攻撃前に自身の奥義発動カウント-1"});
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        UNIT_GRANTS_SPECIAL_COOLDOWN_MINUS_1_TO_UNIT_BEFORE_UNITS_FIRST_ATTACK_NODE,
    ));
}

{
    let funcId = 'grants-special-count-before-first-follow-up-attack';
    let skillId = getCustomSkillId(funcId, {});
    CustomSkill.OPTIONS.push({id: funcId, text: "自分の最初の追撃前に自身の奥義発動カウント-1"});
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_N_TO_TARGET_BEFORE_TARGETS_FIRST_FOLLOW_UP_ATTACK_DURING_COMBAT_NODE(1),
    ));
}

{
    let funcId = 'inflicts-special-count-before-foes-first-attack';
    let skillId = getCustomSkillId(funcId, {});
    CustomSkill.OPTIONS.push({id: funcId, text: "敵の最初の攻撃前に敵の奥義カウント-1"});
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        INFLICTS_SPECIAL_COOLDOWN_COUNT_PLUS_N_ON_TARGETS_FOE_BEFORE_TARGETS_FOES_FIRST_ATTACK_NODE(1),
    ));
}

{
    let funcId = 'inflicts-special-count-before-foes-second-strike';
    let skillId = getCustomSkillId(funcId, {});
    CustomSkill.OPTIONS.push({id: funcId, text: "敵の最初の2回攻撃の2回目の攻撃前に敵の奥義カウント-1"});
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        INFLICTS_SPECIAL_COOLDOWN_COUNT_PLUS_N_ON_TARGETS_FOE_BEFORE_TARGETS_FOES_SECOND_STRIKE_NODE(1),
    ));
}

{
    let funcId = 'inflicts-special-count-before-foes-first-follow-up-attack';
    let skillId = getCustomSkillId(funcId, {});
    CustomSkill.OPTIONS.push({id: funcId, text: "敵の最初の追撃前に敵の奥義カウント-1"});
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        INFLICTS_SPECIAL_COOLDOWN_COUNT_PLUS_N_ON_TARGETS_FOE_BEFORE_TARGETS_FOES_FIRST_FOLLOW_UP_ATTACK_NODE(1),
    ));
}

/// 弱化・強化
{
    let funcId = 'neutralizes-penalties';
    let skillId = getCustomSkillId(funcId, {});
    CustomSkill.OPTIONS.push({id: funcId, text: "自身の弱化を無効"});
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        NEUTRALIZES_PENALTIES_ON_UNIT_NODE,
    ));
}

{
    let funcId = 'neutralizes-foes-bonuses';
    let skillId = getCustomSkillId(funcId, {});
    CustomSkill.OPTIONS.push({id: funcId, text: "相手の強化を無効"});
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
        NEUTRALIZES_FOES_BONUSES_TO_STATS_DURING_COMBAT_NODE,
    ));
}

/// 回復
{
    let funcId = 'foe-cannot-recover-hp-during-combat';
    let skillId = getCustomSkillId(funcId, {});
    CustomSkill.OPTIONS.push({id: funcId, text: "敵は戦闘中HPを回復できない"});
    AT_START_OF_COMBAT_HOOKS.addSkillIfAbsent(skillId, () => SKILL_EFFECT_NODE(
        FOE_CANNOT_RECOVER_HP_DURING_COMBAT_NODE
    ));
}
