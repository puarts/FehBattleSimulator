class CustomSkill {
    static OPTIONS = [];

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
    static FUNC_ID_TO_FUNC = new Map();

    /**
     * 動的に登録済みのスキルIDの集合
     * @type {Set<any>}
     */
    static registeredSkillIds = new Set();

    static Arg = class {
        static Node = {
            NON_NEGATIVE_INTEGER: "non_negative_integer",
            PLUS: "plus",
            MULT: "mult",
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

        static NODE_TO_NODE_TYPE = new Map([
            [this.Node.NON_NEGATIVE_INTEGER, this.NodeType.NON_NEGATIVE_INTEGER],
            [this.Node.PLUS, this.NodeType.OPERATION],
            [this.Node.MULT, this.NodeType.OPERATION],
            [this.Node.VARIABLE, this.NodeType.ID],
            [this.Node.VARIABLE_PERCENTAGE, this.NodeType.PERCENTAGE],
            [this.Node.PERCENTAGE, this.NodeType.PERCENTAGE],
            [this.Node.EFFECTIVE_TYPE, this.NodeType.ID],
            [this.Node.STATUS_EFFECT_TYPE, this.NodeType.ID],
            [this.Node.STAT, this.NodeType.ID],
        ]);

        /**
         * @type {MultiValueMap<string, string>}
         */
        static FUNC_ID_TO_NODES = new MultiValueMap();

        /**
         * @type {MultiValueMap<string, Object>}
         */
        static NODE_TO_OPTIONS = new MultiValueMap();

        /**
         * @type {[NumberNode, string][]}
         */
        static STAT_NODE_LIST = [];

        /**
         * @type {[NumberNode, string][]}
         */
        static VARIABLE_NODE_LIST = [];

        static initArgs(customSkill) {
            const {NON_NEGATIVE_INTEGER, PERCENTAGE, VARIABLE_PERCENTAGE} = this.Node;
            customSkill[1] = {
                [NON_NEGATIVE_INTEGER]: 0,
                [PERCENTAGE]: 100,
                [VARIABLE_PERCENTAGE]: 100
            };
        }

        static getNodeType(node) {
            return this.NODE_TO_NODE_TYPE.get(node);
        }

        static getNonNegativeIntegerNode(args) {
            return NumberNode.makeNumberNodeFrom(args[this.Node.NON_NEGATIVE_INTEGER] ?? 0);
        }

        static getTotalNonNegativeIntegerNode(args) {
            return ADD_NODE(
                this.getNonNegativeIntegerNode(args),
                PERCENTAGE_NODE(this.getVariablePercentageNode(args), this.getVariableNode(args))
            );
        }

        static getPercentageNode(args) {
            return NumberNode.makeNumberNodeFrom(args[this.Node.PERCENTAGE] ?? 0);
        }

        static getVariablePercentageNode(args) {
            return NumberNode.makeNumberNodeFrom(args[this.Node.VARIABLE_PERCENTAGE] ?? 0);
        }

        static getStatNode(args) {
            let id = args[this.Node.STAT];
            return id ? this.STAT_NODE_LIST[id][0] : ZERO_NUMBER_NODE;
        }

        static getVariableNode(args) {
            let id = args[this.Node.VARIABLE];
            return id ? this.VARIABLE_NODE_LIST[id][0] : ZERO_NUMBER_NODE;
        }

        static getStatPercentNode(args) {
            return PERCENTAGE_NODE(this.getPercentageNode(args), this.getStatNode(args));
        }

        /**
         * nodeList の内容を tree.addValue に登録するヘルパー
         * @param {MultiValueMap} nodeToOptions
         * @param {number} node
         * @param {[NumberNode, string][]} nodeList
         */
        static registerOptionsByNode(nodeToOptions, node, nodeList) {
            nodeList.forEach(([_, text], index) => {
                const option = index === 0
                    ? {id: '', text, disabled: true}
                    : {id: index, text};
                nodeToOptions.addValue(node, option);
            });
        }

        static {
            this.STAT_NODE_LIST = [
                [ZERO_NUMBER_NODE, '-- 選択してください --'],
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

            this.VARIABLE_NODE_LIST = [...this.STAT_NODE_LIST];
            // TODO: 追加
            // フレスベルグ、子供カミラ

            this.registerOptionsByNode(this.NODE_TO_OPTIONS, this.Node.STAT, this.STAT_NODE_LIST);
            this.registerOptionsByNode(this.NODE_TO_OPTIONS, this.Node.VARIABLE, this.VARIABLE_NODE_LIST);

            const addEnumOptions = (nodeType, enumObj, getText) => {
                for (const [, value] of Object.entries(enumObj)) {
                    const option = value === enumObj.None
                        ? {id: '', text: '-- 選択してください --', disabled: true}
                        : {id: value, text: getText(value)};
                    this.NODE_TO_OPTIONS.addValue(nodeType, option);
                }
            };

            // 特効タイプ
            addEnumOptions(
                this.Node.EFFECTIVE_TYPE,
                EffectiveType,
                value => EFFECTIVE_TYPE_NAMES.get(value)
            );

            // ステータス状態
            addEnumOptions(
                this.Node.STATUS_EFFECT_TYPE,
                StatusEffectType,
                value => STATUS_EFFECT_INFO_MAP.get(value)[1]
            );
        }
    }

    /**
     * @type {Map<string, string>}
     */
    static FUNC_ID_TO_NAME = new Map();

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
        this.FUNC_ID_TO_FUNC.set(funcId, func);
        // 名前登録
        this.FUNC_ID_TO_NAME.set(funcId, text);
        // 引数設定
        for (let arg of args) {
            this.Arg.FUNC_ID_TO_NODES.addValue(funcId, arg);
        }
    }
}

// setFuncId('XXX', "YYY",
//     (skillId, args) => {
//     },
//     [
//     ],
// );

const NON_NEGATIVE_INTEGER_ARGS = [
    CustomSkill.Arg.Node.NON_NEGATIVE_INTEGER,
    CustomSkill.Arg.Node.PLUS,
    CustomSkill.Arg.Node.VARIABLE,
    CustomSkill.Arg.Node.MULT,
    CustomSkill.Arg.Node.VARIABLE_PERCENTAGE,
];

/// ダメージ+

CustomSkill.setFuncId('deals-damage-excluding-aoe', "ダメージ+（範囲除）",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkillIfAbsent(skillId, () =>
            DEALS_DAMAGE_X_NODE(CustomSkill.Arg.getTotalNonNegativeIntegerNode(args))
        );
    },
    NON_NEGATIVE_INTEGER_ARGS,
);

CustomSkill.setFuncId('deals-damage-of-aoe', "ダメージ+（範囲）",
    (skillId, args) => {
        BEFORE_AOE_SPECIAL_HOOKS.addSkillIfAbsent(skillId, () =>
            DEALS_DAMAGE_X_NODE(CustomSkill.Arg.getTotalNonNegativeIntegerNode(args))
        );
    },
    NON_NEGATIVE_INTEGER_ARGS,
);

CustomSkill.setFuncId('deals-damage-including-aoe', "ダメージ+（範囲含）",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkillIfAbsent(skillId, () =>
            DEALS_DAMAGE_X_NODE(CustomSkill.Arg.getTotalNonNegativeIntegerNode(args))
        );
        BEFORE_AOE_SPECIAL_HOOKS.addSkillIfAbsent(skillId, () =>
            DEALS_DAMAGE_X_NODE(CustomSkill.Arg.getTotalNonNegativeIntegerNode(args))
        );
    },
    NON_NEGATIVE_INTEGER_ARGS,
);

/// ダメージ-

CustomSkill.setFuncId('reduces-damage-excluding-aoe', "ダメージ-（範囲除）",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkillIfAbsent(skillId, () =>
            REDUCES_DAMAGE_BY_N_NODE(CustomSkill.Arg.getTotalNonNegativeIntegerNode(args))
        );
    },
    NON_NEGATIVE_INTEGER_ARGS,
);

CustomSkill.setFuncId('reduces-damage-of-aoe', "ダメージ-（範囲）",
    (skillId, args) => {
        BEFORE_AOE_SPECIAL_HOOKS.addSkillIfAbsent(skillId, () =>
            REDUCES_DAMAGE_BY_N_NODE(CustomSkill.Arg.getTotalNonNegativeIntegerNode(args))
        );
    },
    NON_NEGATIVE_INTEGER_ARGS,
);

CustomSkill.setFuncId('reduces-damage-including-aoe', "ダメージ-（範囲含）",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkillIfAbsent(skillId, () =>
            REDUCES_DAMAGE_BY_N_NODE(CustomSkill.Arg.getTotalNonNegativeIntegerNode(args))
        );
        BEFORE_AOE_SPECIAL_HOOKS.addSkillIfAbsent(skillId, () =>
            REDUCES_DAMAGE_BY_N_NODE(CustomSkill.Arg.getTotalNonNegativeIntegerNode(args))
        );
    },
    NON_NEGATIVE_INTEGER_ARGS,
);

CustomSkill.setFuncId('reduces-damage-from-foes-first-strikes', "最初に受けた攻撃と2回攻撃のダメージ-",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkillIfAbsent(skillId, () =>
            REDUCES_DAMAGE_FROM_FOES_FIRST_ATTACK_BY_N_DURING_COMBAT_INCLUDING_TWICE_NODE(
                CustomSkill.Arg.getTotalNonNegativeIntegerNode(args)
            ),
        );
    },
    NON_NEGATIVE_INTEGER_ARGS,
);

CustomSkill.setFuncId('reduces-damage-from-special-excluding-aoe', "奥義ダメージ-（範囲除）",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkillIfAbsent(skillId, () =>
            REDUCES_DAMAGE_WHEN_FOES_SPECIAL_EXCLUDING_AOE_SPECIAL_NODE(
                CustomSkill.Arg.getTotalNonNegativeIntegerNode(args)
            ),
        );
    },
    NON_NEGATIVE_INTEGER_ARGS,
);

/// ダメージ軽減

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

CustomSkill.setFuncId('reduces-damage-by-x-percent-of-aoe', "ダメージ軽減（範囲）",
    (skillId, args) => {
        BEFORE_AOE_SPECIAL_HOOKS.addSkillIfAbsent(skillId, () =>
            REDUCES_DAMAGE_BEFORE_COMBAT_NODE(
                CustomSkill.Arg.getPercentageNode(args)
            ),
        );
    },
    [
        CustomSkill.Arg.Node.PERCENTAGE,
    ],
);

CustomSkill.setFuncId('reduces-damage-by-x-percent-including-aoe', "ダメージ軽減（範囲含）",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkillIfAbsent(skillId, () =>
            REDUCES_DAMAGE_FROM_TARGETS_FOES_ATTACKS_BY_X_PERCENT_DURING_COMBAT_NODE(
                CustomSkill.Arg.getPercentageNode(args)
            ),
        );
        BEFORE_AOE_SPECIAL_HOOKS.addSkillIfAbsent(skillId, () =>
            REDUCES_DAMAGE_BEFORE_COMBAT_NODE(
                CustomSkill.Arg.getPercentageNode(args)
            ),
        );
    },
    [
        CustomSkill.Arg.Node.PERCENTAGE,
    ],
);

CustomSkill.setFuncId('reduces-damage-by-x-percent-from-first-attack', "最初に受けた攻撃のダメージをn%軽減",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkillIfAbsent(skillId, () =>
            REDUCES_DAMAGE_FROM_FOES_FIRST_ATTACK_BY_N_PERCENT_DURING_COMBAT_NODE(
                CustomSkill.Arg.getPercentageNode(args)
            ),
        );
    },
    [
        CustomSkill.Arg.Node.PERCENTAGE,
    ]
);

CustomSkill.setFuncId('reduces-damage-by-x-percent-from-first-strikes', "最初に受けた攻撃と2回攻撃のダメージをn%軽減",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkillIfAbsent(skillId, () =>
            REDUCES_DAMAGE_FROM_FOES_FIRST_ATTACK_BY_N_PERCENT_DURING_COMBAT_INCLUDING_TWICE_NODE(
                CustomSkill.Arg.getPercentageNode(args)
            ),
        );
    },
    [
        CustomSkill.Arg.Node.PERCENTAGE,
    ]
);

CustomSkill.setFuncId('reduces-damage-by-x-percent-from-follow-up-attack', "追撃のダメージをn%軽減",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkillIfAbsent(skillId, () =>
            REDUCES_DAMAGE_FROM_TARGET_FOES_FOLLOW_UP_ATTACK_BY_X_PERCENT_DURING_COMBAT_NODE(
                CustomSkill.Arg.getPercentageNode(args)
            ),
        );
    },
    [
        CustomSkill.Arg.Node.PERCENTAGE,
    ]
);

CustomSkill.setFuncId('reduces-damage-by-x-percent-from-consecutive-attacks', "連撃のダメージをn%軽減",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkillIfAbsent(skillId, () =>
            REDUCES_DAMAGE_FROM_TARGETS_FOES_CONSECUTIVE_ATTACKS_BY_X_PERCENT_DURING_COMBAT_NODE(
                CustomSkill.Arg.getPercentageNode(args)
            ),
        );
    },
    [
        CustomSkill.Arg.Node.PERCENTAGE,
    ]
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

CustomSkill.setFuncId('reduces-percentage-of-non-special-damage-reduction', "奥義以外のダメージ軽減をn%無効",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkillIfAbsent(skillId, () =>
            REDUCES_PERCENTAGE_OF_TARGETS_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_N_PERCENT_DURING_COMBAT_NODE(
                CustomSkill.Arg.getPercentageNode(args)
            ),
        );
    },
    [
        CustomSkill.Arg.Node.PERCENTAGE,
    ],
);

CustomSkill.setFuncId('neutralizes-non-special-damage-reduction-when-special',
    "奥義発動時、奥義以外のダメージ軽減を無効",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkillIfAbsent(skillId, () =>
            WHEN_SPECIAL_TRIGGERS_NEUTRALIZES_FOES_REDUCES_DAMAGE_BY_PERCENTAGE_EFFECTS_FROM_FOES_NON_SPECIAL_EXCLUDING_AOE_SPECIALS_NODE,
        );
    },
    []
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
    NON_NEGATIVE_INTEGER_ARGS,
);

CustomSkill.setFuncId('when-deals-damage-restores-n-hp', "攻撃でダメージを与えたとき、n回復",
    (skillId, args) => {
        AT_START_OF_ATTACK_HOOKS.addSkillIfAbsent(skillId, () => SKILL_EFFECT_NODE(
            WHEN_TARGET_DEALS_DAMAGE_DURING_COMBAT_RESTORES_N_HP_PER_ATTACK_TO_TARGET_NODE(
                args(CustomSkill.Arg.Node.NON_NEGATIVE_INTEGER) ?? 0
            ),
        ));
    },
    NON_NEGATIVE_INTEGER_ARGS,
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

CustomSkill.setFuncId('attack-range-on-map', "射程n（マップ時。1以上を入力）",
    (skillId, args) => {
        CAN_ATTACK_FOES_N_SPACES_AWAY_HOOKS.addSkill(skillId, () =>
            CustomSkill.Arg.getNonNegativeIntegerNode(args),
        );
    },
    [
        CustomSkill.Arg.Node.NON_NEGATIVE_INTEGER,
    ]
);

CustomSkill.setFuncId('attack-range-1-during-combat', "スキル効果の射程の判定は、射程1として扱う",
    (skillId, args) => {
        SKILL_IDS_THAT_SKILLS_EFFECTS_RANGE_IS_TREATED_AS_1.add(skillId);
    },
    []
);

CustomSkill.setFuncId('attack-range-2-during-combat', "スキル効果の射程の判定は、射程2として扱う",
    (skillId, args) => {
        SKILL_IDS_THAT_SKILLS_EFFECTS_RANGE_IS_TREATED_AS_2.add(skillId);
    },
    []
);

CustomSkill.setFuncId(
    'accelerates-special-trigger-cooldown-count–1',
    "奥義が発動しやすい（最低1）",
    (skillId, args) => {
        ACCELERATES_SPECIAL_TRIGGER_SET.add(skillId);
    },
    []
);

CustomSkill.setFuncId(
    'reflex-foes-first-attack',
    "最初の攻撃を反射",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
            TARGETS_NEXT_ATTACK_DEALS_DAMAGE_EQ_TOTAL_DAMAGE_REDUCED_FROM_TARGETS_FOES_FIRST_ATTACK_NODE,
        ));
    },
    []
);

CustomSkill.setFuncId(
    'non-special-miracle',
    "奥義以外の祈り",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
            TARGET_CAN_ACTIVATE_NON_SPECIAL_MIRACLE_NODE(0),
        ));
    },
    []
);

CustomSkill.setFuncId(
    'neutralizes-foes-non-special-miracle',
    "奥義以外の祈り無効",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
            NEUTRALIZES_TARGET_FOES_NON_SPECIAL_MIRACLE,
        ));
    },
    []
);

CustomSkill.setFuncId(
    'unconditional-scowl',
    "無条件竜眼",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
            INFLICTS_SPECIAL_COOLDOWN_COUNT_PLUS_N_ON_TARGETS_FOE_BEFORE_TARGETS_FOES_FIRST_ATTACK_NODE(1),
        ));
    },
    []
);

CustomSkill.setFuncId(
    'conditional-scowl',
    "竜眼（相手攻撃奥義+魔防比較あり）",
    (skillId, args) => {
        WHEN_APPLIES_EFFECTS_AFTER_COMBAT_STATS_DETERMINED_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
            IF_NODE(
                AND_NODE(
                    CAN_FOES_ATTACK_TRIGGER_FOES_SPECIAL_NODE,
                    GTE_NODE(UNITS_EVAL_RES_DURING_COMBAT_NODE, ADD_NODE(5, FOES_EVAL_RES_DURING_COMBAT_NODE))
                ),
                INFLICTS_SPECIAL_COOLDOWN_COUNT_PLUS_N_ON_TARGETS_FOE_BEFORE_TARGETS_FOES_FIRST_ATTACK_NODE(1),
            ),
        ));
    },
    []
);

CustomSkill.setFuncId(
    'inflicts-special-charge-1-on-foe',
    "敵の奥義発動カウント変動量-1",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
            INFLICTS_SPECIAL_COOLDOWN_CHARGE_MINUS_1_ON_FOE_NODE,
        ));
    },
    []
);

CustomSkill.setFuncId(
    'grants-special-charge-1-to-unit-per-attack',
    "戦闘中、自身の奥義発動カウント変動量+1",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
            GRANTS_SPECIAL_COOLDOWN_CHARGE_PLUS_1_TO_UNIT_PER_ATTACK_DURING_COMBAT_NODE,
        ));
    },
    []
);

CustomSkill.setFuncId(
    'neutralizes-special-charge-plus-to-foe',
    "敵の奥義発動カウント変動量+を無効",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
            NEUTRALIZES_EFFECTS_THAT_GRANT_SPECIAL_COOLDOWN_CHARGE_PLUS_X_TO_FOE,
        ));
    },
    []
);

CustomSkill.setFuncId(
    'neutralizes-special-charge-minus-on-unit',
    "自身の奥義発動カウント変動量-を無効",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
            NEUTRALIZES_EFFECTS_THAT_INFLICT_SPECIAL_COOLDOWN_CHARGE_MINUS_X_ON_UNIT,
        ));
    },
    []
);

CustomSkill.setFuncId(
    'tempo',
    "拍節",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
            NEUTRALIZES_EFFECTS_THAT_GRANT_SPECIAL_COOLDOWN_CHARGE_PLUS_X_TO_FOE,
            NEUTRALIZES_EFFECTS_THAT_INFLICT_SPECIAL_COOLDOWN_CHARGE_MINUS_X_ON_UNIT,
        ));
    },
    []
);

CustomSkill.setFuncId(
    'makes-guaranteed-follow-up-attack',
    "絶対追撃",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
            UNIT_MAKES_GUARANTEED_FOLLOW_UP_ATTACK_NODE,
        ));
    },
    []
);

CustomSkill.setFuncId(
    'foe-cannot-make-follow-up-attack',
    "敵は追撃不可",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
            FOE_CANNOT_MAKE_FOLLOW_UP_ATTACK_NODE,
        ));
    },
    []
);

CustomSkill.setFuncId(
    'neutralizes-guarantee-foes-follow-up-attack',
    "敵の絶対追撃を無効",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
            UNIT_NEUTRALIZES_EFFECTS_THAT_GUARANTEE_FOES_FOLLOW_UP_ATTACKS_DURING_COMBAT_NODE,
        ));
    },
    []
);

CustomSkill.setFuncId(
    'neutralizes-prevent-follow-up-attack',
    "自身の追撃不可を無効",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
            UNIT_NEUTRALIZES_EFFECTS_THAT_PREVENT_UNITS_FOLLOW_UP_ATTACKS_DURING_COMBAT,
        ));
    },
    []
);

CustomSkill.setFuncId(
    'foe-cannot-counterattack',
    "敵は反撃不可",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
            FOE_CANNOT_COUNTERATTACK_NODE,
        ));
    },
    []
);

CustomSkill.setFuncId(
    'neutralizes-prevent-counterattack',
    "自身の反撃不可を無効",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
            NEUTRALIZES_EFFECTS_THAT_PREVENT_TARGETS_COUNTERATTACKS_DURING_COMBAT_NODE,
        ));
    },
    []
);

CustomSkill.setFuncId(
    'can-make-follow-up-attack-before-foes-next-attack',
    "攻め立て",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
            UNIT_CAN_MAKE_FOLLOW_UP_ATTACK_BEFORE_FOES_NEXT_ATTACK_NODE,
        ));
    },
    []
);

CustomSkill.setFuncId(
    'counterattack-before-foes-first-attack',
    "先制攻撃（待ち伏せ）",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
            TARGET_CAN_COUNTERATTACK_BEFORE_TARGETS_FOES_FIRST_ATTACK_NODE,
        ));
    },
    []
);

CustomSkill.setFuncId(
    'attacks-twice-when-initiates-combat',
    "攻撃時、2回攻撃",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
            TARGET_ATTACKS_TWICE_WHEN_TARGET_INITIATES_COMBAT_NODE,
        ));
    },
    []
);

CustomSkill.setFuncId(
    'attacks-twice-when-foe-initiates-combat',
    "攻撃された時、2回攻撃",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
            TARGET_ATTACKS_TWICE_WHEN_TARGETS_FOE_INITIATES_COMBAT_NODE,
        ));
    },
    []
);

CustomSkill.setFuncId(
    'attacks-twice-even-if-foe-initiates-combat',
    "2回攻撃（受けの時も2回攻撃）",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
            TARGET_ATTACKS_TWICE_EVEN_IF_TARGETS_FOE_INITIATES_COMBAT_NODE,
        ));
    },
    []
);

CustomSkill.setFuncId(
    'can-move-through-foes-spaces',
    "すり抜け",
    (skillId, args) => {
        CAN_MOVE_THROUGH_FOES_SPACE_SKILL_SET.add(skillId);
    },
    []
);

CustomSkill.setFuncId(
    'prevent-a-special-during-combat',
    "戦闘中、敵は攻撃奥義を発動できない",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
            FOE_CANNOT_TRIGGER_ATTACKER_SPECIAL,
        ));
    },
    []
);

CustomSkill.setFuncId(
    'foe-prevent-a-special-during-combat',
    "戦闘中、自分は攻撃奥義を発動できない",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
            UNIT_CANNOT_TRIGGER_ATTACKER_SPECIAL,
        ));
    },
    []
);

CustomSkill.setFuncId(
    'prevent-d-special-during-combat',
    "戦闘中、敵は防御奥義を発動できない",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
            FOE_CANNOT_TRIGGER_DEFENDER_SPECIAL,
        ));
    },
    []
);

CustomSkill.setFuncId(
    'foe-prevent-d-special-during-combat',
    "戦闘中、自分は防御奥義を発動できない",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
            UNIT_CANNOT_TRIGGER_DEFENDER_SPECIAL,
        ));
    },
    []
);

CustomSkill.setFuncId(
    'prevent-special-during-combat',
    "戦闘中、敵は奥義を発動できない",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
            FOE_CANNOT_TRIGGER_SPECIALS_DURING_COMBAT_NODE,
        ));
    },
    []
);

CustomSkill.setFuncId(
    'foe-prevent-special-during-combat',
    "戦闘中、自分は奥義を発動できない",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
            UNIT_CANNOT_TRIGGER_SPECIALS_DURING_COMBAT_NODE,
        ));
    },
    []
);

CustomSkill.setFuncId(
    'prevent-aoe-special',
    "敵は範囲奥義を発動できない",
    (skillId, args) => {
        BEFORE_AOE_SPECIAL_ACTIVATION_CHECK_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
            FOE_CANNOT_TRIGGER_AREA_OF_EFFECT_SPECIALS_NODE,
        ));
    },
    []
);

CustomSkill.setFuncId(
    'foe-prevent-aoe-special',
    "自分は範囲奥義を発動できない",
    (skillId, args) => {
        BEFORE_AOE_SPECIAL_ACTIVATION_CHECK_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
            UNIT_CANNOT_TRIGGER_AREA_OF_EFFECT_SPECIALS_NODE,
        ));
    },
    []
);

CustomSkill.setFuncId(
    'grants-special-count-before-first-attack',
    "自分の最初の攻撃前に自身の奥義発動カウント-1",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
            UNIT_GRANTS_SPECIAL_COOLDOWN_MINUS_1_TO_UNIT_BEFORE_UNITS_FIRST_ATTACK_NODE,
        ));
    },
    []
);

CustomSkill.setFuncId(
    'grants-special-count-before-first-follow-up-attack',
    "自分の最初の追撃前に自身の奥義発動カウント-1",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
            GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_N_TO_TARGET_BEFORE_TARGETS_FIRST_FOLLOW_UP_ATTACK_DURING_COMBAT_NODE(1),
        ));
    },
    []
);

CustomSkill.setFuncId(
    'inflicts-special-count-before-foes-first-attack',
    "敵の最初の攻撃前に敵の奥義カウント-1",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
            INFLICTS_SPECIAL_COOLDOWN_COUNT_PLUS_N_ON_TARGETS_FOE_BEFORE_TARGETS_FOES_FIRST_ATTACK_NODE(1),
        ));
    },
    []
);

CustomSkill.setFuncId(
    'inflicts-special-count-before-foes-second-strike',
    "敵の最初の2回攻撃の2回目の攻撃前に敵の奥義カウント-1",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
            INFLICTS_SPECIAL_COOLDOWN_COUNT_PLUS_N_ON_TARGETS_FOE_BEFORE_TARGETS_FOES_SECOND_STRIKE_NODE(1),
        ));
    },
    []
);

CustomSkill.setFuncId(
    'inflicts-special-count-before-foes-first-follow-up-attack',
    "敵の最初の追撃前に敵の奥義カウント-1",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
            INFLICTS_SPECIAL_COOLDOWN_COUNT_PLUS_N_ON_TARGETS_FOE_BEFORE_TARGETS_FOES_FIRST_FOLLOW_UP_ATTACK_NODE(1),
        ));
    },
    []
);

CustomSkill.setFuncId(
    'neutralizes-penalties',
    "自身の弱化を無効",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
            NEUTRALIZES_PENALTIES_ON_UNIT_NODE,
        ));
    },
    []
);

CustomSkill.setFuncId(
    'neutralizes-foes-bonuses',
    "相手の強化を無効",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
            NEUTRALIZES_FOES_BONUSES_TO_STATS_DURING_COMBAT_NODE,
        ));
    },
    []
);

CustomSkill.setFuncId(
    'foe-cannot-recover-hp-during-combat',
    "敵は戦闘中HPを回復できない",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkillIfAbsent(skillId, () => SKILL_EFFECT_NODE(
            FOE_CANNOT_RECOVER_HP_DURING_COMBAT_NODE,
        ));
    },
    []
);

CustomSkill.setFuncId(
    'cancels-foes-attack',
    "敵の攻撃をキャンセル",
    (skillId, args) => {
        CANCEL_FOES_ATTACK_HOOKS.addSkillIfAbsent(skillId, () => TRUE_NODE);
    },
    []
);

CustomSkill.setFuncId(
    'cancels-foes-attack-ending-their-action',
    "敵の攻撃をキャンセルし、行動済みに",
    (skillId, args) => {
        CANCEL_FOES_ATTACK_HOOKS.addSkillIfAbsent(skillId, () => TRUE_NODE);
        AFTER_CANCEL_FOES_ATTACK_HOOKS.addSkillIfAbsent(skillId, () => SKILL_EFFECT_NODE(
            ENDS_TARGETS_ACTION_BY_STATUS_EFFECT_NODE
        ));
    },
    []
);
