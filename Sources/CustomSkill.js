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
        // Nodeに登録したものは
        // 1. NODE_TO_NODE_TYPEにNodeTypeを設定すること
        // 2. 必要であれば値を取得する関数を作成
        // 3. 新しいNodeTypeがあればCustomSkillFormに登録する
        static Node = {
            BR: "br",

            PLUS: "plus",
            MULT: "mult",

            SPACES_LABEL: "spaces_label",
            TARGET_LABEL: "target_label",
            STATUS_EFFECT_LABEL: "status_effect_label",
            STAT_BONUS_LABEL: "stat_bonus_label",
            STAT_PENALTY_LABEL: "stat_penalty_label",
            STAT_LABEL: "stat_label",

            NON_NEGATIVE_INTEGER: "non_negative_integer",
            VARIABLE: "variable",
            VARIABLE_PERCENTAGE: "variable_percentage",
            PERCENTAGE: "percentage",
            EFFECTIVE_TYPE: "effective_type",
            EFFECTIVE_TYPES: "effective_types",
            STATUS_EFFECT_TYPE: "status_effect_type",
            STATUS_EFFECT_TYPES: "status_effect_types",
            UNITS: "units",
            STAT: "stat",
            STAT_N: "stat_n",
            STAT_N_BONUS: "stat_n_bonus",
            STAT_N_PENALTY: "stat_n_penalty",
            STAT_BONUS: "stat_bonus",
            STAT_PENALTY: "stat_penalty",
        }

        static StringNodeToStrings = new Map(
            [
                [this.Node.SPACES_LABEL, 'マス'],
                [this.Node.TARGET_LABEL, '対象: '],
                [this.Node.STATUS_EFFECT_LABEL, '付与: '],
                [this.Node.STAT_BONUS_LABEL, '強化: '],
                [this.Node.STAT_PENALTY_LABEL, '弱化: '],
                [this.Node.STAT_LABEL, 'ステ: '],
            ]
        );

        static NodeType = {
            INTEGER: "integer",
            NON_NEGATIVE_INTEGER: "non_negative_integer",
            PERCENTAGE: "percentage",
            ID: "id",
            IDS: "ids",
            SKILL_ID: "skill_id",
            OPERATION: "operation",
            STRING: "string",
        }

        static NODE_TO_NODE_TYPE = new Map([
            [this.Node.PLUS, this.NodeType.OPERATION],
            [this.Node.MULT, this.NodeType.OPERATION],

            [this.Node.SPACES_LABEL, this.NodeType.STRING],
            [this.Node.TARGET_LABEL, this.NodeType.STRING],
            [this.Node.STATUS_EFFECT_LABEL, this.NodeType.STRING],
            [this.Node.STAT_BONUS_LABEL, this.NodeType.STRING],
            [this.Node.STAT_PENALTY_LABEL, this.NodeType.STRING],
            [this.Node.STAT_LABEL, this.NodeType.STRING],

            [this.Node.NON_NEGATIVE_INTEGER, this.NodeType.NON_NEGATIVE_INTEGER],
            [this.Node.VARIABLE, this.NodeType.ID],
            [this.Node.VARIABLE_PERCENTAGE, this.NodeType.PERCENTAGE],
            [this.Node.PERCENTAGE, this.NodeType.PERCENTAGE],
            [this.Node.EFFECTIVE_TYPE, this.NodeType.ID],
            [this.Node.EFFECTIVE_TYPES, this.NodeType.IDS],
            [this.Node.STATUS_EFFECT_TYPE, this.NodeType.ID],
            [this.Node.STATUS_EFFECT_TYPES, this.NodeType.IDS],
            [this.Node.UNITS, this.NodeType.ID],
            [this.Node.STAT, this.NodeType.ID],
            [this.Node.STAT_N, this.NodeType.ID],
            [this.Node.STAT_N_BONUS, this.NodeType.ID],
            [this.Node.STAT_N_PENALTY, this.NodeType.ID],
            [this.Node.STAT_N_BONUS, this.NodeType.ID],
            [this.Node.STAT_BONUS, this.NodeType.NON_NEGATIVE_INTEGER],
            [this.Node.STAT_PENALTY, this.NodeType.NON_NEGATIVE_INTEGER],
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
         * @type {Map<string, [NumberNode, string]>}
         */
        static STAT_NODES;

        /**
         * @type {Map<string, [function(*): NumberNode, string]>}
         */
        static STAT_N_NODES;

        /**
         * @type {Map<string, [NumberNode, string]>}
         */
        static VARIABLE_NODES;

        /**
         * @type {Map<string, [UnitsNode, string]>}
         */
        static UNITS_NODES;

        static initArgs(vm, customSkill) {
            const {
                NON_NEGATIVE_INTEGER,
                PERCENTAGE,
                VARIABLE_PERCENTAGE,
                EFFECTIVE_TYPES,
                STATUS_EFFECT_TYPES
            } = this.Node;
            vm.$set(customSkill, 1, {
                [NON_NEGATIVE_INTEGER]: 0,
                [PERCENTAGE]: 100,
                [VARIABLE_PERCENTAGE]: 100,
                [EFFECTIVE_TYPES]: [''],
                [STATUS_EFFECT_TYPES]: [''],
            });
        }

        static idsToNodes(args, key) {
            return (args[key] ?? []).filter(v => v !== '' && v !== -1).map(et => NumberNode.makeNumberNodeFrom(et));
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

        static getTotalStatValueNode(args) {
            return ADD_NODE(
                this.getStatBonus(args),
                this.getStatPenalty(args),
                this.getTotalNonNegativeIntegerNode(args),
            );
        }

        static getPercentageNode(args) {
            return NumberNode.makeNumberNodeFrom(args[this.Node.PERCENTAGE] ?? 0);
        }

        static getEffectiveType(args) {
            return NumberNode.makeNumberNodeFrom(args[this.Node.EFFECTIVE_TYPE] ?? 0);
        }

        static getEffectiveTypes(args) {
            return this.idsToNodes(args, this.Node.EFFECTIVE_TYPES);
        }

        static getStatusEffectTypeNode(args) {
            return NumberNode.makeNumberNodeFrom(args[this.Node.STATUS_EFFECT_TYPE] ?? 0);
        }

        static getStatusEffectTypesNode(args) {
            return this.idsToNodes(args, this.Node.STATUS_EFFECT_TYPES);
        }

        static getUnitsNode(args) {
            let id = args[this.Node.UNITS];
            return id ? this.UNITS_NODES.get(id)[0] : UnitsNode.EMPTY_UNITS_NODE;
        }

        static getVariablePercentageNode(args) {
            return NumberNode.makeNumberNodeFrom(args[this.Node.VARIABLE_PERCENTAGE] ?? 0);
        }

        static getStatNode(args) {
            let id = args[this.Node.STAT];
            return id ? this.STAT_NODES.get(id)[0] : ZERO_NUMBER_NODE;
        }

        static getStatNNode(args) {
            let id = args[this.Node.STAT_N];
            return id ? this.STAT_N_NODES.get(id)[0] : _ => ZERO_STATS_NODE;
        }

        static getStatNBonusNode(args) {
            let id = args[this.Node.STAT_N_BONUS];
            return id ? this.STAT_N_NODES.get(id)[0] : _ => ZERO_STATS_NODE;
        }

        static getStatNPenaltyNode(args) {
            let id = args[this.Node.STAT_N_PENALTY];
            return id ? this.STAT_N_NODES.get(id)[0] : _ => ZERO_STATS_NODE;
        }

        static getVariableNode(args) {
            let id = args[this.Node.VARIABLE];
            return id ? this.VARIABLE_NODES.get(id)[0] : ZERO_NUMBER_NODE;
        }

        static getStatPercentNode(args) {
            return PERCENTAGE_NODE(this.getPercentageNode(args), this.getStatNode(args));
        }

        static getStatBonus(args) {
            return NumberNode.makeNumberNodeFrom(args[this.Node.STAT_BONUS] ?? 0);
        }

        static getStatPenalty(args) {
            return NumberNode.makeNumberNodeFrom(args[this.Node.STAT_PENALTY] ?? 0);
        }

        /**
         * @param {MultiValueMap} nodeToOptions
         * @param {string} node
         * @param {Map<string, [*, string]>} nodes
         */
        static registerOptionsByNode(nodeToOptions, node, nodes) {
            for (const [id, [_, text]] of nodes.entries()) {
                const option = id === ''
                    ? {id: id, text, disabled: true}
                    : {id: id, text};
                nodeToOptions.addValue(node, option);
            }
        }

        static {
            this.STAT_NODES = new Map([
                ['', [ZERO_NUMBER_NODE, '-- 選択してください --']],

                ['atk-at-start-of-combat', [UNITS_ATK_AT_START_OF_COMBAT_NODE, '戦闘開始時の攻撃']],
                ['spd-at-start-of-combat', [UNITS_SPD_AT_START_OF_COMBAT_NODE, '戦闘開始時の速さ']],
                ['def-at-start-of-combat', [UNITS_DEF_AT_START_OF_COMBAT_NODE, '戦闘開始時の守備']],
                ['res-at-start-of-combat', [UNITS_RES_AT_START_OF_COMBAT_NODE, '戦闘開始時の魔防']],

                ['foe-atk-at-start-of-combat', [FOES_ATK_AT_START_OF_COMBAT_NODE, '戦闘開始時の敵の攻撃']],
                ['foe-spd-at-start-of-combat', [FOES_SPD_AT_START_OF_COMBAT_NODE, '戦闘開始時の敵の速さ']],
                ['foe-def-at-start-of-combat', [FOES_DEF_AT_START_OF_COMBAT_NODE, '戦闘開始時の敵の守備']],
                ['foe-res-at-start-of-combat', [FOES_RES_AT_START_OF_COMBAT_NODE, '戦闘開始時の敵の魔防']],

                ['atk', [UNITS_ATK_NODE, '攻撃']],
                ['spd', [UNITS_SPD_NODE, '速さ']],
                ['def', [UNITS_DEF_NODE, '守備']],
                ['res', [UNITS_RES_NODE, '魔防']],

                ['foe-atk', [FOES_ATK_NODE, '敵の攻撃']],
                ['foe-spd', [FOES_SPD_NODE, '敵の速さ']],
                ['foe-def', [FOES_DEF_NODE, '敵の守備']],
                ['foe-res', [FOES_RES_NODE, '敵の魔防']],
            ]);
            this.VARIABLE_NODES = new Map(this.STAT_NODES);
            this.VARIABLE_NODES.set(
                'highest-total-penalties-among-foe-and-foes-allies-within-2-spaces-of-target-node',
                [
                    HIGHEST_TOTAL_PENALTIES_AMONG_TARGET_AND_FOES_WITHIN_N_SPACES_OF_TARGET_NODE(2),
                    '敵とその周囲2マス以内の弱化の合計の最大値'
                ]);
            this.VARIABLE_NODES.set(
                'total-number-of-bonuses-and-penalties-active-on-foe-and-any-foe-within-2-spaces-of-foe-mult-3',
                [
                    MULT_NODE(TOTAL_NUMBER_OF_BONUSES_AND_PENALTIES_ACTIVE_ON_FOE_AND_ANY_FOE_WITHIN_N_SPACES_OF_FOE(2), 3),
                    '敵とその周囲2マス以内の敵の【有利な状態】と【不利な状態異常】の数×3'
                ]);

            this.registerOptionsByNode(this.NODE_TO_OPTIONS, this.Node.STAT, this.STAT_NODES);
            this.registerOptionsByNode(this.NODE_TO_OPTIONS, this.Node.VARIABLE, this.VARIABLE_NODES);

            this.STAT_N_NODES = new Map([
                ['', [_ => ZERO_STATS_NODE, '-- 選択してください --']],
                ['nothing', [_ => ZERO_STATS_NODE, 'なし']],
                ['atk-n', [ATK_NODE, '攻撃']],
                ['spd-n', [SPD_NODE, '速さ']],
                ['def-n', [DEF_NODE, '守備']],
                ['res-n', [RES_NODE, '魔防']],
                ['atk-spd-n', [ATK_SPD_NODE, '攻撃、速さ']],
                ['atk-def-n', [ATK_DEF_NODE, '攻撃、守備']],
                ['atk-res-n', [ATK_RES_NODE, '攻撃、魔防']],
                ['spd-def-n', [SPD_DEF_NODE, '速さ、守備']],
                ['spd-res-n', [SPD_RES_NODE, '速さ、魔防']],
                ['def-res-n', [DEF_RES_NODE, '守備、魔防']],
                ['atk-spd-def-n', [ATK_SPD_DEF_NODE, '攻撃、速さ、守備']],
                ['atk-spd-res-n', [ATK_SPD_RES_NODE, '攻撃、速さ、魔防']],
                ['atk-def-res-n', [ATK_DEF_RES_NODE, '攻撃、守備、魔防']],
                ['spd-def-res-n', [SPD_DEF_RES_NODE, '速さ、守備、魔防']],
                ['atk-spd-def-res-n', [ATK_SPD_DEF_RES_NODE, '攻撃、速さ、守備、魔防']],
            ]);
            this.registerOptionsByNode(this.NODE_TO_OPTIONS, this.Node.STAT_N, this.STAT_N_NODES);
            this.registerOptionsByNode(this.NODE_TO_OPTIONS, this.Node.STAT_N_BONUS, this.STAT_N_NODES);
            this.registerOptionsByNode(this.NODE_TO_OPTIONS, this.Node.STAT_N_PENALTY, this.STAT_N_NODES);

            this.UNITS_NODES = new Map([
                ['', [UnitsNode.EMPTY_UNITS_NODE, '-- 選択してください --']],
                ['target', [UnitsNode.makeFromUnit(TARGET_NODE), '自分']],
                ['target-and-targets-allies-within-1-spaces', [TARGET_AND_TARGETS_ALLIES_WITHIN_N_SPACES_NODE(1), '自分と周囲1マス以内の味方']],
                ['target-and-targets-allies-within-2-spaces', [TARGET_AND_TARGETS_ALLIES_WITHIN_N_SPACES_NODE(2), '自分と周囲2マス以内の味方']],
                ['target-and-targets-allies-within-3-spaces', [TARGET_AND_TARGETS_ALLIES_WITHIN_N_SPACES_NODE(3), '自分と周囲3マス以内の味方']],
                ['target-and-targets-allies-within-4-spaces', [TARGET_AND_TARGETS_ALLIES_WITHIN_N_SPACES_NODE(4), '自分と周囲4マス以内の味方']],
                ['target-and-targets-allies-within-5-spaces', [TARGET_AND_TARGETS_ALLIES_WITHIN_N_SPACES_NODE(5), '自分と周囲5マス以内の味方']],

                ['closest-foes', [TARGETS_CLOSEST_FOES_NODE, '最も近い敵']],

                ['closest-foes-and-those-allies-within-1-spaces', [TARGETS_CLOSEST_FOES_AND_FOES_ALLIES_WITHIN_N_SPACES_OF_THOSE_FOES_NODE(1, TRUE_NODE), '最も近い敵とその周囲1マス以内の敵']],
                ['closest-foes-and-those-allies-within-2-spaces', [TARGETS_CLOSEST_FOES_AND_FOES_ALLIES_WITHIN_N_SPACES_OF_THOSE_FOES_NODE(2, TRUE_NODE), '最も近い敵とその周囲2マス以内の敵']],
                ['closest-foes-and-those-allies-within-3-spaces', [TARGETS_CLOSEST_FOES_AND_FOES_ALLIES_WITHIN_N_SPACES_OF_THOSE_FOES_NODE(3, TRUE_NODE), '最も近い敵とその周囲3マス以内の敵']],
                ['closest-foes-and-those-allies-within-4-spaces', [TARGETS_CLOSEST_FOES_AND_FOES_ALLIES_WITHIN_N_SPACES_OF_THOSE_FOES_NODE(4, TRUE_NODE), '最も近い敵とその周囲4マス以内の敵']],
                ['closest-foes-and-those-allies-within-5-spaces', [TARGETS_CLOSEST_FOES_AND_FOES_ALLIES_WITHIN_N_SPACES_OF_THOSE_FOES_NODE(5, TRUE_NODE), '最も近い敵とその周囲5マス以内の敵']],

                ['closest-foes-within-5-spaces-and-foes-allies-within-2-spaces',
                    [CLOSEST_FOES_WITHIN_5_SPACES_OF_BOTH_ASSIST_TARGETING_AND_ASSIST_TARGET_AND_FOES_WITHIN_2_SPACES_OF_THOSE_FOES_NODE,
                        '自分と補助対象の周囲5マス以内の最も近い敵と周囲2マス以内の敵']],

                ['assist-target', [UnitsNode.makeFromUnit(ASSIST_TARGET_NODE), '補助対象']],
                ['unit-and-target-and-those-allies-within-2-spaces',
                    [ALLIES_WITHIN_N_SPACES_OF_BOTH_ASSIST_UNIT_AND_TARGET(2),
                        '自分と補助対象の周囲2マス以内の味方']],
                ['unit-and-target-and-those-allies-within-2-spaces-except-self',
                    [REMOVE_UNITS_NODE(ALLIES_WITHIN_N_SPACES_OF_BOTH_ASSIST_UNIT_AND_TARGET(2), SKILL_OWNER_NODE),
                        '自分と補助対象の周囲2マス以内の味方（自分を除く）']],

                ['skill-owner-and-allies-within-3-rows-3-columns-centered-on-skill-owner',
                    [SKILL_OWNER_AND_SKILL_OWNERS_ALLIES_WITHIN_N_ROWS_OR_N_COLUMNS_CENTERED_ON_SKILL_OWNER_NODE(3),
                        '自分と自分を中心とした縦3列と横3列の味方']],
                ['skill-owner-and-allies-within-4-rows-4-columns-centered-on-skill-owner',
                    [SKILL_OWNER_AND_SKILL_OWNERS_ALLIES_WITHIN_N_ROWS_OR_N_COLUMNS_CENTERED_ON_SKILL_OWNER_NODE(4),
                        '自分と自分を中心とした縦4列と横4列の味方']],
                ['skill-owner-and-allies-within-5-rows-5-columns-centered-on-skill-owner',
                    [SKILL_OWNER_AND_SKILL_OWNERS_ALLIES_WITHIN_N_ROWS_OR_N_COLUMNS_CENTERED_ON_SKILL_OWNER_NODE(5),
                        '自分と自分を中心とした縦5列と横5列の味方']],

                ['allies-within-3-rows-3-columns-centered-on-skill-owner',
                    [SKILL_OWNERS_ALLIES_WITHIN_N_ROWS_OR_N_COLUMNS_CENTERED_ON_SKILL_OWNER_NODE(3),
                        '自分を中心とした縦3列と横3列の味方']],
                ['allies-within-4-rows-4-columns-centered-on-skill-owner',
                    [SKILL_OWNERS_ALLIES_WITHIN_N_ROWS_OR_N_COLUMNS_CENTERED_ON_SKILL_OWNER_NODE(4),
                        '自分を中心とした縦4列と横4列の味方']],
                ['allies-within-5-rows-5-columns-centered-on-skill-owner',
                    [SKILL_OWNERS_ALLIES_WITHIN_N_ROWS_OR_N_COLUMNS_CENTERED_ON_SKILL_OWNER_NODE(5),
                        '自分を中心とした縦5列と横5列の味方']],

                ['foes-within-3-rows-3-columns-centered-on-skill-owner',
                    [SKILL_OWNERS_FOES_WITHIN_N_ROWS_OR_N_COLUMNS_CENTERED_ON_SKILL_OWNER_NODE(3),
                        '自分を中心とした縦3列と横3列の敵']],
                ['foes-within-4-rows-4-columns-centered-on-skill-owner',
                    [SKILL_OWNERS_FOES_WITHIN_N_ROWS_OR_N_COLUMNS_CENTERED_ON_SKILL_OWNER_NODE(4),
                        '自分を中心とした縦4列と横4列の敵']],
                ['foes-within-5-rows-5-columns-centered-on-skill-owner',
                    [SKILL_OWNERS_FOES_WITHIN_N_ROWS_OR_N_COLUMNS_CENTERED_ON_SKILL_OWNER_NODE(5),
                        '自分を中心とした縦5列と横5列の敵']],

                ['target-and-targets-allies-on-map', [TARGET_AND_TARGETS_ALLIES_ON_MAP_NODE, '味方全員']],
                ['foes-on-map', [TARGETS_FOES_ON_MAP_NODE, '敵全員']],
                ['units-on-map', [UNITS_ON_MAP_NODE, '全員']],
            ]);
            this.registerOptionsByNode(this.NODE_TO_OPTIONS, this.Node.UNITS, this.UNITS_NODES);

            /**
             * enumObjは-1が選択されていない状態を表す必要がある
             * @param nodeType
             * @param enumObj
             * @param getText
             */
            const addEnumOptions = (nodeType, enumObj, getText) => {
                this.NODE_TO_OPTIONS.addValue(nodeType, {id: '', text: '-- 選択してください --', disabled: true});
                for (const [, value] of Object.entries(enumObj)) {
                    this.NODE_TO_OPTIONS.addValue(nodeType, {id: value, text: getText(value)});
                }
            };

            // 特効タイプ
            addEnumOptions(
                this.Node.EFFECTIVE_TYPE,
                EffectiveType,
                value => EFFECTIVE_TYPE_NAMES.get(value)
            );
            addEnumOptions(
                this.Node.EFFECTIVE_TYPES,
                EffectiveType,
                value => EFFECTIVE_TYPE_NAMES.get(value)
            );

            // ステータス状態
            addEnumOptions(
                this.Node.STATUS_EFFECT_TYPE,
                StatusEffectType,
                value => STATUS_EFFECT_INFO_MAP.get(value)[1]
            );
            addEnumOptions(
                this.Node.STATUS_EFFECT_TYPES,
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

CustomSkill.setFuncId(
    'grants-stat-bonuses',
    "戦闘中、ステータス+n",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkillIfAbsent(skillId, () =>
            GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE(
                CustomSkill.Arg.getStatNBonusNode(args)(CustomSkill.Arg.getTotalStatValueNode(args)),
            ),
        );
    },
    [
        // 強化
        CustomSkill.Arg.Node.STAT_N_BONUS,
        CustomSkill.Arg.Node.BR,
        CustomSkill.Arg.Node.STAT_BONUS,
        CustomSkill.Arg.Node.PLUS,
        CustomSkill.Arg.Node.BR,
        CustomSkill.Arg.Node.VARIABLE,
        CustomSkill.Arg.Node.MULT,
        CustomSkill.Arg.Node.VARIABLE_PERCENTAGE,
    ],
);

CustomSkill.setFuncId(
    'inflicts-foes-stat-penalties',
    "戦闘中、敵のステータス-n",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkillIfAbsent(skillId, () =>
            INFLICTS_STATS_MINUS_ON_FOE_DURING_COMBAT_NODE(
                CustomSkill.Arg.getStatNBonusNode(args)(CustomSkill.Arg.getTotalStatValueNode(args)),
            ),
        );
    },
    [
        // 弱化
        CustomSkill.Arg.Node.STAT_N_BONUS,
        CustomSkill.Arg.Node.BR,
        CustomSkill.Arg.Node.STAT_PENALTY,
        CustomSkill.Arg.Node.PLUS,
        CustomSkill.Arg.Node.BR,
        CustomSkill.Arg.Node.VARIABLE,
        CustomSkill.Arg.Node.MULT,
        CustomSkill.Arg.Node.VARIABLE_PERCENTAGE,
    ],
);

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

CustomSkill.setFuncId(
    'reduces-damage-from-foes-next-attack-by-x-percent-once-per-combat',
    "奥義条件を満たした時、受けた攻撃のダメージをn%軽減（1戦闘1回のみ）",
    (skillId, args) => {
        AT_APPLYING_ONCE_PER_COMBAT_DAMAGE_REDUCTION_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
            IF_NODE(
                // If unit’s or foe’s Special is ready,
                // or unit’s or foe’s Special triggered before or during this combat,
                IF_UNITS_OR_FOES_SPECIAL_IS_READY_OR_UNITS_OR_FOES_SPECIAL_TRIGGERED_BEFORE_OR_DURING_COMBAT_NODE,
                // reduces damage from foe’s next attack by 40% (once per combat; excluding area-of-effect Specials).
                REDUCES_DAMAGE_FROM_TARGETS_FOES_NEXT_ATTACK_BY_N_PERCENT_ONCE_PER_COMBAT_NODE(
                    CustomSkill.Arg.getPercentageNode(args)
                ),
            )
        ));
    },
    [
        CustomSkill.Arg.Node.PERCENTAGE,
    ]
)

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
CustomSkill.setFuncId('effective-against-n', "特効",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkillIfAbsent(skillId, () => SKILL_EFFECT_NODE(
            EFFECTIVE_AGAINST_NODE(...CustomSkill.Arg.getEffectiveTypes(args)),
        ));
    },
    [
        CustomSkill.Arg.Node.EFFECTIVE_TYPES,
    ],
);

// 特効無効
CustomSkill.setFuncId('neutralizes-effective-against-bonuses', "特効無効",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
            // Neutralizes "effective against" bonuses for all movement types.
            TARGET_NEUTRALIZES_EFFECTIVE_AGAINST_X_NODE(...CustomSkill.Arg.getEffectiveTypes(args)),
        ));
    },
    [
        CustomSkill.Arg.Node.EFFECTIVE_TYPES,
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

// ターン開始時
let ADD_STATUS_EFFECT_TO_TARGET_ARGS = [
    // 対象
    CustomSkill.Arg.Node.TARGET_LABEL,
    CustomSkill.Arg.Node.UNITS,
    CustomSkill.Arg.Node.BR,

    // 状態
    CustomSkill.Arg.Node.STATUS_EFFECT_LABEL,
    CustomSkill.Arg.Node.STATUS_EFFECT_TYPES,
    CustomSkill.Arg.Node.BR,

    // 強化
    CustomSkill.Arg.Node.STAT_LABEL,
    CustomSkill.Arg.Node.STAT_N_BONUS,
    CustomSkill.Arg.Node.BR,
    CustomSkill.Arg.Node.STAT_BONUS_LABEL,
    CustomSkill.Arg.Node.STAT_BONUS,
    CustomSkill.Arg.Node.BR,

    // 弱化
    CustomSkill.Arg.Node.STAT_LABEL,
    CustomSkill.Arg.Node.STAT_N_PENALTY,
    CustomSkill.Arg.Node.BR,
    CustomSkill.Arg.Node.STAT_PENALTY_LABEL,
    CustomSkill.Arg.Node.STAT_PENALTY,
];
let GRANTS_OR_INFLICTS_ON_MAP_NODE = args =>
    FOR_EACH_UNIT_NODE(
        CustomSkill.Arg.getUnitsNode(args),
        // TODO: 不利な状態もこのノードでつけてしまっているので修正する
        GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(...CustomSkill.Arg.getStatusEffectTypesNode(args)),
        GRANTS_STATS_PLUS_TO_TARGET_ON_MAP_NODE(
            CustomSkill.Arg.getStatNBonusNode(args)(CustomSkill.Arg.getStatBonus(args)),
        ),
        INFLICTS_STATS_MINUS_ON_TARGET_ON_MAP_NODE(
            CustomSkill.Arg.getStatNPenaltyNode(args)(CustomSkill.Arg.getStatPenalty(args)),
        ),
    );

CustomSkill.setFuncId(
    'at-start-of-turn-grants-status-effect-on-unit',
    "ターン開始時、対象に状態を付与",
    (skillId, args) => {
        AT_START_OF_TURN_HOOKS.addSkillIfAbsent(skillId, () => SKILL_EFFECT_NODE(
            GRANTS_OR_INFLICTS_ON_MAP_NODE(args),
        ));
    },
    ADD_STATUS_EFFECT_TO_TARGET_ARGS
);

CustomSkill.setFuncId(
    'at-start-of-enemy-phase-grants-status-effect-on-unit',
    "敵軍ターン開始時、対象に状態を付与",
    (skillId, args) => {
        AT_START_OF_ENEMY_PHASE_HOOKS.addSkillIfAbsent(skillId, () => SKILL_EFFECT_NODE(
            GRANTS_OR_INFLICTS_ON_MAP_NODE(args),
        ));
    },
    ADD_STATUS_EFFECT_TO_TARGET_ARGS
);

CustomSkill.setFuncId(
    'at-start-of-player-or-enemy-phase-grants-status-effect-on-unit',
    "自軍、敵軍ターン開始時、対象に状態を付与",
    (skillId, args) => {
        setAtStartOfPlayerPhaseOrEnemyPhase(skillId, () => SKILL_EFFECT_NODE(
            GRANTS_OR_INFLICTS_ON_MAP_NODE(args),
        ));
    },
    ADD_STATUS_EFFECT_TO_TARGET_ARGS
);

CustomSkill.setFuncId(
    'if-rally-or-movement-is-used-by-unit-grants-status-effect-on-unit',
    "応援、移動系補助を使用した時、対象に状態を付与",
    (skillId, args) => {
        CAN_RALLY_FORCIBLY_HOOKS.addSkill(skillId, () => TRUE_NODE);
        CAN_RALLIED_FORCIBLY_HOOKS.addSkill(skillId, () => TRUE_NODE);
        setIfRallyOrMovementAssistSkillIsUsedByUnit(skillId, () => SKILL_EFFECT_NODE(
            GRANTS_OR_INFLICTS_ON_MAP_NODE(args),
        ));
    },
    ADD_STATUS_EFFECT_TO_TARGET_ARGS
);

CustomSkill.setFuncId(
    'if-rally-or-movement-is-used-by-unit-or-target-grants-status-effect-on-unit',
    "応援、移動系補助を使用した時、または自分に使用された時、対象に状態を付与",
    (skillId, args) => {
        CAN_RALLY_FORCIBLY_HOOKS.addSkill(skillId, () => TRUE_NODE);
        CAN_RALLIED_FORCIBLY_HOOKS.addSkill(skillId, () => TRUE_NODE);
        setIfRallyOrMovementAssistSkillIsUsedByUnitOrTargetsUnit(skillId, () => SKILL_EFFECT_NODE(
            GRANTS_OR_INFLICTS_ON_MAP_NODE(args),
        ));
    },
    ADD_STATUS_EFFECT_TO_TARGET_ARGS
);

CustomSkill.setFuncId(
    'if-rally-or-movement-is-used-by-unit-restores-hp',
    "応援、移動系補助を使用した時、対象を回復",
    (skillId, args) => {
        CAN_RALLY_FORCIBLY_HOOKS.addSkill(skillId, () => TRUE_NODE);
        CAN_RALLIED_FORCIBLY_HOOKS.addSkill(skillId, () => TRUE_NODE);
        setIfRallyOrMovementAssistSkillEndedByUnit(skillId, () => SKILL_EFFECT_NODE(
            FOR_EACH_UNIT_NODE(
                CustomSkill.Arg.getUnitsNode(args),
                RESTORE_TARGETS_HP_ON_MAP_NODE(CustomSkill.Arg.getTotalNonNegativeIntegerNode(args)),
            ),
        ));
    },
    [
        // 対象
        CustomSkill.Arg.Node.TARGET_LABEL,
        CustomSkill.Arg.Node.UNITS,
        CustomSkill.Arg.Node.BR,
        ...NON_NEGATIVE_INTEGER_ARGS
    ],
);

CustomSkill.setFuncId(
    'if-rally-or-movement-is-used-by-unit-or-target-restores-hp',
    "応援、移動系補助を使用した時、または自分に使用された時、対象を回復",
    (skillId, args) => {
        CAN_RALLY_FORCIBLY_HOOKS.addSkill(skillId, () => TRUE_NODE);
        CAN_RALLIED_FORCIBLY_HOOKS.addSkill(skillId, () => TRUE_NODE);
        setIfRallyOrMovementAssistSkillEndedByUnit(skillId, () => SKILL_EFFECT_NODE(
            FOR_EACH_UNIT_NODE(
                CustomSkill.Arg.getUnitsNode(args),
                RESTORE_TARGETS_HP_ON_MAP_NODE(CustomSkill.Arg.getTotalNonNegativeIntegerNode(args)),
            ),
        ));
    },
    [
        // 対象
        CustomSkill.Arg.Node.TARGET_LABEL,
        CustomSkill.Arg.Node.UNITS,
        CustomSkill.Arg.Node.BR,
        ...NON_NEGATIVE_INTEGER_ARGS
    ],
);

CustomSkill.setFuncId(
    'if-rally-or-movement-is-used-by-unit-neutralizes-penalties',
    "応援、移動系補助を使用した時、対象の不利な状態異常を解除",
    (skillId, args) => {
        CAN_RALLY_FORCIBLY_HOOKS.addSkill(skillId, () => TRUE_NODE);
        CAN_RALLIED_FORCIBLY_HOOKS.addSkill(skillId, () => TRUE_NODE);
        setIfRallyOrMovementAssistSkillEndedByUnit(skillId, () => SKILL_EFFECT_NODE(
            FOR_EACH_UNIT_NODE(
                CustomSkill.Arg.getUnitsNode(args),
                NEUTRALIZES_ANY_PENALTY_ON_TARGET_NODE,
            ),
        ));
    },
    [
        // 対象
        CustomSkill.Arg.Node.TARGET_LABEL,
        CustomSkill.Arg.Node.UNITS,
        CustomSkill.Arg.Node.BR,
    ],
);

CustomSkill.setFuncId(
    'if-rally-or-movement-is-used-by-unit-or-target-neutralizes-penalties',
    "応援、移動系補助を使用した時、または自分に使用された時、対象の不利な状態異常を解除",
    (skillId, args) => {
        CAN_RALLY_FORCIBLY_HOOKS.addSkill(skillId, () => TRUE_NODE);
        CAN_RALLIED_FORCIBLY_HOOKS.addSkill(skillId, () => TRUE_NODE);
        setIfRallyOrMovementAssistSkillEndedByUnit(skillId, () => SKILL_EFFECT_NODE(
            FOR_EACH_UNIT_NODE(
                CustomSkill.Arg.getUnitsNode(args),
                NEUTRALIZES_ANY_PENALTY_ON_TARGET_NODE,
            ),
        ));
    },
    [
        // 対象
        CustomSkill.Arg.Node.TARGET_LABEL,
        CustomSkill.Arg.Node.UNITS,
        CustomSkill.Arg.Node.BR,
    ],
);

CustomSkill.setFuncId(
    'grants-another-action-after-rally-or-movement-is-used-by-unit',
    "応援、移動系補助を使用した時、自分を行動可能にする（再行動）",
    (skillId, args) => {
        CAN_RALLY_FORCIBLY_HOOKS.addSkill(skillId, () => TRUE_NODE);
        CAN_RALLIED_FORCIBLY_HOOKS.addSkill(skillId, () => TRUE_NODE);
        setIfRallyOrMovementAssistSkillEndedByUnit(skillId, () => SKILL_EFFECT_NODE(
            GRANTS_ANOTHER_ACTION_ON_ASSIST_NODE,
        ));
    },
    []
);

CustomSkill.setFuncId(
    'has-pathfinder',
    "天駆の道",
    (skillId, args) => {
        HAS_PATHFINDER_HOOKS.addSkill(skillId, () => TRUE_NODE);
    },
    []
);

// デバッファー、アフリクター

CustomSkill.setFuncId(
    'is-debuffer-1',
    'Tier 1 デバッファー',
    (skillId, args) => {
        IS_DEBUFFER_TIER_1_HOOKS.addSkill(skillId, () => TRUE_NODE);
    },
    []
);

CustomSkill.setFuncId(
    'is-debuffer-2',
    'Tier 2 デバッファー',
    (skillId, args) => {
        IS_DEBUFFER_TIER_2_HOOKS.addSkill(skillId, () => TRUE_NODE);
    },
    []
);

CustomSkill.setFuncId(
    'is-afflictor',
    'アフリクター',
    (skillId, args) => {
        IS_AFFLICTOR_HOOKS.addSkill(skillId, () => TRUE_NODE);
    },
    []
);

CustomSkill.setFuncId(
    'can-rally-forcibly',
    'バフをかけられなくても応援可能になる',
    (skillId, args) => {
        CAN_RALLY_FORCIBLY_HOOKS.addSkill(skillId, () => TRUE_NODE);
    },
    []
);

CustomSkill.setFuncId(
    'can-rallied-forcibly',
    'バフをかけられなくても応援を受けられるようになる',
    (skillId, args) => {
        CAN_RALLIED_FORCIBLY_HOOKS.addSkill(skillId, () => TRUE_NODE);
    },
    []
);
