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
            BR: 'br',

            PLUS: 'plus',
            MULT: 'mult',

            SPACES_LABEL: 'spaces_label',
            TARGET_LABEL: 'target_label',
            STATUS_EFFECT_LABEL: 'status_effect_label',
            STAT_BONUS_LABEL: 'stat_bonus_label',
            STAT_PENALTY_LABEL: 'stat_penalty_label',
            STAT_LABEL: 'stat_label',
            ASSIST_LABEL: 'assist_label',
            CANTO_ASSIST_LABEL: 'canto_assist_label',
            RANGE_LABEL: 'range_label',
            MIN_LABEL: 'min_label',
            MAX_LABEL: 'max_label',
            TURN_LABEL: 'turn_label',

            NON_NEGATIVE_INTEGER: 'non_negative_integer',
            NUMBER_ARG_1: 'number_arg_1',
            NUMBER_ARG_2: 'number_arg_2',
            MIN: 'min',
            MAX: 'max',
            VARIABLE: 'variable',
            VARIABLE_PERCENTAGE: 'variable_percentage',
            PERCENTAGE: 'percentage',
            EFFECTIVE_TYPE: 'effective_type',
            EFFECTIVE_TYPES: 'effective_types',
            STATUS_EFFECT_TYPE: 'status_effect_type',
            STATUS_EFFECT_TYPES: 'status_effect_types',
            ASSIST_TYPE: 'assist_type',
            CANTO_ASSIST_TYPE: 'canto_assist_type',
            DIVINE_VEIN_TYPE: 'divine_vein_type',
            UNITS: 'units',
            STAT: 'stat',
            // TODO: rename
            // 攻撃、攻撃速さ守備魔防などのこと
            STAT_N: 'stat_n',
            STAT_N_BONUS: 'stat_n_bonus',
            STAT_N_PENALTY: 'stat_n_penalty',
            STAT_BONUS: 'stat_bonus',
            STAT_PENALTY: 'stat_penalty',
            TARGET_SPACES: 'target_spaces',
        }

        static StringNodeToStrings = new Map(
            [
                [this.Node.SPACES_LABEL, 'マス'],
                [this.Node.TARGET_LABEL, '対象: '],
                [this.Node.STATUS_EFFECT_LABEL, '付与: '],
                [this.Node.STAT_BONUS_LABEL, '強化: '],
                [this.Node.STAT_PENALTY_LABEL, '弱化: '],
                [this.Node.STAT_LABEL, 'ステ: '],
                [this.Node.ASSIST_LABEL, '補助: '],
                [this.Node.CANTO_ASSIST_LABEL, '補助: '],
                [this.Node.RANGE_LABEL, '射程: '],
                [this.Node.MIN_LABEL, '最小: '],
                [this.Node.MAX_LABEL, '最大: '],
                [this.Node.TURN_LABEL, 'ターン: '],
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
            [this.Node.ASSIST_LABEL, this.NodeType.STRING],
            [this.Node.CANTO_ASSIST_LABEL, this.NodeType.STRING],
            [this.Node.RANGE_LABEL, this.NodeType.STRING],
            [this.Node.MIN_LABEL, this.NodeType.STRING],
            [this.Node.MAX_LABEL, this.NodeType.STRING],
            [this.Node.TURN_LABEL, this.NodeType.STRING],

            [this.Node.NON_NEGATIVE_INTEGER, this.NodeType.NON_NEGATIVE_INTEGER],
            [this.Node.NUMBER_ARG_1, this.NodeType.NON_NEGATIVE_INTEGER],
            [this.Node.NUMBER_ARG_2, this.NodeType.NON_NEGATIVE_INTEGER],
            [this.Node.MIN, this.NodeType.NON_NEGATIVE_INTEGER],
            [this.Node.MAX, this.NodeType.NON_NEGATIVE_INTEGER],
            [this.Node.VARIABLE, this.NodeType.ID],
            [this.Node.VARIABLE_PERCENTAGE, this.NodeType.PERCENTAGE],
            [this.Node.PERCENTAGE, this.NodeType.PERCENTAGE],
            [this.Node.EFFECTIVE_TYPE, this.NodeType.ID],
            [this.Node.EFFECTIVE_TYPES, this.NodeType.IDS],
            [this.Node.STATUS_EFFECT_TYPE, this.NodeType.ID],
            [this.Node.STATUS_EFFECT_TYPES, this.NodeType.IDS],
            [this.Node.ASSIST_TYPE, this.NodeType.ID],
            [this.Node.CANTO_ASSIST_TYPE, this.NodeType.ID],
            [this.Node.DIVINE_VEIN_TYPE, this.NodeType.ID],
            [this.Node.UNITS, this.NodeType.ID],
            [this.Node.STAT, this.NodeType.ID],
            [this.Node.STAT_N, this.NodeType.ID],
            [this.Node.STAT_N_BONUS, this.NodeType.ID],
            [this.Node.STAT_N_PENALTY, this.NodeType.ID],
            [this.Node.STAT_N_BONUS, this.NodeType.ID],
            [this.Node.TARGET_SPACES, this.NodeType.ID],
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

        static getNumberNode(args, node) {
            return NumberNode.makeNumberNodeFrom(args[node] ?? 0);
        }

        static ensureMinMax(args, numberNode) {
            let min = args[this.Node.MIN] ?
                this.getNumberNode(args, this.Node.MIN) :
                CONSTANT_NUMBER_NODE(Number.MIN_SAFE_INTEGER);
            let max = args[this.Node.MAX] ?
                this.getNumberNode(args, this.Node.MAX) :
                CONSTANT_NUMBER_NODE(Number.MAX_SAFE_INTEGER);
            return ENSURE_MIN_MAX_NODE(numberNode, min, max);
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

        static getNumber(args, node) {
            return NumberNode.makeNumberNodeFrom(args[node] ?? 0);
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

        static getAssistTypeNode(args) {
            return NumberNode.makeNumberNodeFrom(args[this.Node.ASSIST_TYPE] ?? 0);
        }

        static getCantoAssistTypesNode(args) {
            return NumberNode.makeNumberNodeFrom(args[this.Node.CANTO_ASSIST_TYPE] ?? 0);
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

        static getSpacesFuncNode(args) {
            let id = args[this.Node.TARGET_SPACES];
            return id ? this.TARGET_SPACES_FUNC_NODES.get(id)[0] : _ => () => EMPTY_SPACES_NODE;
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

            this.TARGET_SPACES_FUNC_NODES = new Map([
                ['', [_ => ZERO_STATS_NODE, '-- 選択してください --']],
                [
                    'n-spaces-in-a-line',
                    [
                        n =>
                            N_SPACES_IN_A_LINE_CENTERED_ON_TARGETS_FOES_SPACE_ORIENTED_LEFT_TO_RIGHT_BASED_ON_THE_DIRECTION_TARGET_IS_FACING_NODE(
                                ADD_NODE(MULT_NODE(n, 2), 1),
                                n * 2 + 1
                            ),
                        '自分から見た敵のマスの左右それぞれのnマス',
                    ],
                ],
                [
                    'spaces-within-n-spaces-of-target',
                    [
                        SPACES_WITHIN_N_SPACES_OF_TARGET_NODE,
                        '自分の周囲nマス'
                    ]
                ],
                [
                    'spaces-within-n-spaces-of-foe',
                    [
                        SPACES_WITHIN_N_SPACES_OF_FOE_NODE,
                        '敵の周囲nマス'
                    ]
                ],
                [
                    'spaces-within-n-spaces-of-closest-foes',
                    [
                        n => SPACES_WITHIN_N_SPACES_OF_SPACES_NODE(n, PLACED_SPACES_NODE(TARGETS_CLOSEST_FOES_NODE)),
                        '最も近い敵の周囲nマス'
                    ]
                ],
            ]);
            this.registerOptionsByNode(this.NODE_TO_OPTIONS, this.Node.TARGET_SPACES, this.TARGET_SPACES_FUNC_NODES);

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
            addEnumOptions(
                this.Node.ASSIST_TYPE,
                AssistType,
                value => getAssistTypeName(value)
            );
            addEnumOptions(
                this.Node.CANTO_ASSIST_TYPE,
                CantoSupport,
                value => getCantoAssistName(value)
            );
            addEnumOptions(
                this.Node.DIVINE_VEIN_TYPE,
                DivineVeinType,
                value => getDivineVeinName(value)
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
        STATS_SKILL_USING_STATS_HOOKS.addSkillIfAbsent(skillId, () =>
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
        NON_STATS_SKILL_USING_STATS_HOOKS.addSkillIfAbsent(skillId, () =>
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
        NON_STATS_SKILL_USING_STATS_HOOKS.addSkillIfAbsent(skillId, () =>
            DEALS_DAMAGE_X_NODE(CustomSkill.Arg.getTotalNonNegativeIntegerNode(args))
        );
        BEFORE_AOE_SPECIAL_HOOKS.addSkillIfAbsent(skillId, () =>
            DEALS_DAMAGE_X_NODE(CustomSkill.Arg.getTotalNonNegativeIntegerNode(args))
        );
    },
    NON_NEGATIVE_INTEGER_ARGS,
);

CustomSkill.setFuncId('boost-special-damage', "奥義ダメージ+（範囲除）",
    (skillId, args) => {
        WHEN_APPLIES_SPECIAL_EFFECTS_AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () =>
            BOOSTS_DAMAGE_WHEN_SPECIAL_TRIGGERS_NODE(
                CustomSkill.Arg.getTotalNonNegativeIntegerNode(args)
            ),
        );
    },
    NON_NEGATIVE_INTEGER_ARGS,
);

CustomSkill.setFuncId('first-follow-up-damage', "最初の追撃のダメージ+",
    (skillId, args) => {
        AT_START_OF_ATTACK_HOOKS.addSkill(skillId, () =>
            TARGETS_FIRST_FOLLOW_UP_ATTACK_DEALS_X_DAMAGE_NODE(
                CustomSkill.Arg.getTotalNonNegativeIntegerNode(args)
            ),
        );
    },
    NON_NEGATIVE_INTEGER_ARGS,
);

/// ダメージ-

CustomSkill.setFuncId('reduces-damage-excluding-aoe', "ダメージ-（範囲除）",
    (skillId, args) => {
        NON_STATS_SKILL_USING_STATS_HOOKS.addSkillIfAbsent(skillId, () =>
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
        NON_STATS_SKILL_USING_STATS_HOOKS.addSkillIfAbsent(skillId, () =>
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
        NON_STATS_SKILL_USING_STATS_HOOKS.addSkillIfAbsent(skillId, () =>
            REDUCES_DAMAGE_FROM_FOES_FIRST_ATTACK_BY_N_DURING_COMBAT_INCLUDING_TWICE_NODE(
                CustomSkill.Arg.getTotalNonNegativeIntegerNode(args)
            ),
        );
    },
    NON_NEGATIVE_INTEGER_ARGS,
);

CustomSkill.setFuncId(
    'reduces-damage-from-foes-second-strike-of-first-attack',
    '最初に受けた2回攻撃の2回目のダメージ-',
    (skillId, args) => {
        NON_STATS_SKILL_USING_STATS_HOOKS.addSkillIfAbsent(skillId, () =>
            REDUCES_DAMAGE_FROM_TARGETS_FOES_SECOND_STRIKE_OF_FIRST_ATTACK_BY_N_DURING_COMBAT_NODE(
                CustomSkill.Arg.getTotalNonNegativeIntegerNode(args)
            ),
        );
    },
    NON_NEGATIVE_INTEGER_ARGS,
);

CustomSkill.setFuncId('reduces-damage-from-special-excluding-aoe', "奥義ダメージ-（範囲除）",
    (skillId, args) => {
        NON_STATS_SKILL_USING_STATS_HOOKS.addSkillIfAbsent(skillId, () =>
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
                IS_THE_UNITS_OR_FOES_SPECIAL_READY_OR_WAS_THE_UNITS_OR_FOES_SPECIAL_TRIGGERED_BEFORE_OR_DURING_THIS_COMBAT,
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
                args[CustomSkill.Arg.Node.NON_NEGATIVE_INTEGER] ?? 0
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
        NON_STATS_SKILL_USING_STATS_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
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
        CAN_MOVE_THROUGH_FOES_SPACE_SKILLS.add(skillId);
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
    'grants-special-count-before-foes-first-attack',
    "敵の最初の攻撃前に自身の奥義カウント-1",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
            GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_N_TO_TARGET_BEFORE_TARGETS_FOES_FIRST_ATTACK_DURING_COMBAT_NODE(1),
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
    'inflicts-special-count-before-first-attack',
    "最初の攻撃前に敵の奥義カウント-1",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
            INFLICTS_SPECIAL_COOLDOWN_COUNT_PLUS_N_ON_TARGETS_FOE_BEFORE_TARGETS_FIRST_ATTACK_NODE(1),
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

const CUSTOM_SKILLS_ON_MAP_ENTRIES = [
    [
        'at-start-of-turn',
        '自軍ターン開始時',
        (skillId, nodeFunc, args) =>
            AT_START_OF_TURN_HOOKS.addSkill(skillId, () => nodeFunc(args)),
    ],
    [
        'at-start-of-enemy-phase',
        '敵軍ターン開始時',
        (skillId, nodeFunc, args) =>
            AT_START_OF_ENEMY_PHASE_HOOKS.addSkill(skillId, () => nodeFunc(args)),
    ],
    [
        'at-start-of-player-or-enemy-phase',
        '自軍、および敵軍ターン開始時',
        (skillId, nodeFunc, args) =>
            setAtStartOfPlayerPhaseOrEnemyPhase(skillId, () => nodeFunc(args)),
    ],
    [
        'at-start-of-player-and-enemy-phase-except-for-in-summoners-duels',
        '自軍、および決闘を除く敵軍ターン開始時',
        (skillId, nodeFunc, args) =>
            setAtStartOfPlayerPhaseOrEnemyPhaseExceptForInSummonerDuels(skillId, () => nodeFunc(args)),
    ],
    [
        'after-start-of-turn-skills-on-player-phase',
        '自軍ターン開始時スキル発動後',
        (skillId, nodeFunc, args) =>
            AFTER_START_OF_TURN_EFFECTS_TRIGGER_ON_PLAYER_PHASE_HOOKS.addSkill(skillId, () => nodeFunc(args)),
    ],
    [
        'after-start-of-turn-skills-on-enemy-phase',
        '敵軍ターン開始時スキル発動後',
        (skillId, nodeFunc, args) =>
            AFTER_START_OF_TURN_EFFECTS_TRIGGER_ON_ENEMY_PHASE_HOOKS.addSkill(skillId, () => nodeFunc(args)),
    ],
    [
        'after-start-of-turn-skills-on-player-or-enemy',
        '自軍、敵軍ターン開始時スキル発動後',
        (skillId, nodeFunc, args) =>
            setAfterStartOfTurnEffectsTriggerOnPlayerOrEnemyPhaseHooks(skillId, () => nodeFunc(args)),
    ],
    [
        'after-acts-if-canto-after-canto',
        '行動後（再移動後）',
        (skillId, nodeFunc, args) =>
            AFTER_UNIT_ACTS_IF_CANTO_TRIGGERS_AFTER_CANTO_HOOKS.addSkill(skillId, () => nodeFunc(args)),
    ],
    [
        'at-start-of-player-phase-or-after-acts-if-canto-after-canto',
        'ターン開始時、および行動後（再移動後）',
        (skillId, nodeFunc, args) =>
            setAtStartOfPlayerPhaseOrAfterActsIfCantoAfterCanto(skillId, () => nodeFunc(args)),
    ],
    // TODO: 踊った時、踊られた時を実装
    // TODO: 応援、移動補助を分ける
    [
        'if-rally-or-movement-is-used-by-unit',
        '応援、移動系補助を使用した時',
        (skillId, nodeFunc, args) => {
            CAN_RALLY_FORCIBLY_HOOKS.addSkill(skillId, () => TRUE_NODE);
            CAN_RALLIED_FORCIBLY_HOOKS.addSkill(skillId, () => TRUE_NODE);
            setIfRallyOrMovementAssistSkillIsUsedByUnit(skillId, () => nodeFunc(args));
        },
    ],
    // TODO: 自分に使用された時を実装
    [
        'if-rally-or-movement-is-used-by-unit-or-target',
        '応援、移動系補助を使用した時、または自分に使用された時',
        (skillId, nodeFunc, args) => {
            CAN_RALLY_FORCIBLY_HOOKS.addSkill(skillId, () => TRUE_NODE);
            CAN_RALLIED_FORCIBLY_HOOKS.addSkill(skillId, () => TRUE_NODE);
            setIfRallyOrMovementAssistSkillIsUsedByUnitOrTargetsUnit(skillId, () => nodeFunc(args));
        },
    ],
    [
        'after-rally-or-movement-is-used-by-unit',
        '応援、移動系補助を使用した時、その後（再行動用）',
        (skillId, nodeFunc, args) => {
            CAN_RALLY_FORCIBLY_HOOKS.addSkill(skillId, () => TRUE_NODE);
            CAN_RALLIED_FORCIBLY_HOOKS.addSkill(skillId, () => TRUE_NODE);
            setIfRallyOrMovementAssistSkillEndedByUnit(skillId, () => nodeFunc(args));
        },
    ],
    [
        'after-combat',
        '戦闘後',
        (skillId, nodeFunc, args) => {
            AFTER_COMBAT_HOOKS.addSkill(skillId, () => nodeFunc(args));
        },
    ],
    [
        'after-combat-even-if-the-unit-is-defeated',
        '戦闘後（死んでも発動）',
        (skillId, nodeFunc, args) => {
            AFTER_COMBAT_EVEN_IF_DEFEATED_HOOKS.addSkill(skillId, () => nodeFunc(args));
        },
    ],
    [
        'after-combat-for-allies',
        '味方の戦闘後',
        (skillId, nodeFunc, args) => {
            AFTER_COMBAT_FOR_ALLIES_EVEN_IF_DEFEATED_HOOKS.addSkill(skillId, () => nodeFunc(args));
        },
    ],
    [
        'after-combat-if-attacked',
        '攻撃していれば、戦闘後',
        (skillId, nodeFunc, args) => {
            AFTER_COMBAT_IF_UNIT_ATTACKED_HOOKS.addSkill(skillId, () => nodeFunc(args));
        },
    ],
    [
        'after-combat-for-another-action',
        '戦闘後（再行動用）',
        (skillId, nodeFunc, args) => {
            AFTER_COMBAT_FOR_ANOTHER_ACTION_HOOKS.addSkill(skillId, () => nodeFunc(args));
        },
    ],
    [
        'after-being-granted-another-action',
        '再行動後',
        (skillId, nodeFunc, args) => {
            AFTER_BEING_GRANTED_ANOTHER_ACTION_ON_ASSIST_HOOKS.addSkill(skillId, () => nodeFunc(args));
        }
    ],
    [
        'after-action-without-combat-for-another-action',
        '戦闘をしていない時の行動後（再行動用）',
        (skillId, nodeFunc, args) => {
            AFTER_ACTION_WITHOUT_COMBAT_FOR_ANOTHER_ACTION_HOOKS.addSkill(skillId, () => nodeFunc(args));
        },
    ]
];

/**
 * @param {string} nodeId
 * @param {string} nodeName
 * @param {Function<Object>} nodeFunc argsオブジェクトを受け取ってノード返す関数
 * @param {Array} argArray
 */
function makeCustomSkillsOnMap(nodeId, nodeName, nodeFunc, argArray = []) {
    for (let [skillId, name, hookFunc] of CUSTOM_SKILLS_ON_MAP_ENTRIES) {
        CustomSkill.setFuncId(
            `${skillId}-${nodeId}`,
            `${name}、${nodeName}`,
            (skillId, args) => {
                hookFunc(skillId, nodeFunc, args)
            },
            argArray,
        );
    }
}

makeCustomSkillsOnMap(
    'grants-status-effect-on-unit',
    '対象に状態を付与',
    args => GRANTS_OR_INFLICTS_ON_MAP_NODE(args),
    ADD_STATUS_EFFECT_TO_TARGET_ARGS
);

makeCustomSkillsOnMap(
    'neutralizes-penalties',
    '対象の不利な状態異常を解除',
    args =>
        FOR_EACH_UNIT_NODE(
            CustomSkill.Arg.getUnitsNode(args),
            NEUTRALIZES_ANY_PENALTY_ON_TARGET_NODE
        ),
    [
        // 対象
        CustomSkill.Arg.Node.TARGET_LABEL,
        CustomSkill.Arg.Node.UNITS,
        CustomSkill.Arg.Node.BR,
    ]
);

makeCustomSkillsOnMap(
    'neutralizes-bonuses',
    '対象の有利な状態を解除',
    args =>
        FOR_EACH_UNIT_NODE(
            CustomSkill.Arg.getUnitsNode(args),
            NEUTRALIZES_ANY_BONUSES_ON_TARGET_NODE,
        ),
    [
        // 対象
        CustomSkill.Arg.Node.TARGET_LABEL,
        CustomSkill.Arg.Node.UNITS,
        CustomSkill.Arg.Node.BR,
    ]
);

makeCustomSkillsOnMap(
    'converts-penalties-into-bonuses',
    '対象の弱化を強化に変換する',
    args =>
        FOR_EACH_UNIT_NODE(
            CustomSkill.Arg.getUnitsNode(args),
            CONVERTS_PENALTIES_ON_TARGET_INTO_BONUSES_NODE,
        ),
    [
        // 対象
        CustomSkill.Arg.Node.TARGET_LABEL,
        CustomSkill.Arg.Node.UNITS,
        CustomSkill.Arg.Node.BR,
    ]
);

makeCustomSkillsOnMap(
    'converts-bonuses-into-penalties',
    '対象の強化を弱化に変換する',
    args =>
        FOR_EACH_UNIT_NODE(
            CustomSkill.Arg.getUnitsNode(args),
            CONVERTS_BONUSES_ON_TARGET_INTO_PENALTIES_NODE,
        ),
    [
        // 対象
        CustomSkill.Arg.Node.TARGET_LABEL,
        CustomSkill.Arg.Node.UNITS,
        CustomSkill.Arg.Node.BR,
    ]
);

makeCustomSkillsOnMap(
    'neutralizes-targets-n-penalty-effects-node',
    '不利な状態異常をn個解除',
    args =>
        FOR_EACH_UNIT_NODE(
            CustomSkill.Arg.getUnitsNode(args),
            NEUTRALIZES_TARGETS_N_PENALTY_EFFECTS_NODE(CustomSkill.Arg.getNumberNode(args, CustomSkill.Arg.Node.NUMBER_ARG_1)),
        ),
    [
        // 対象
        CustomSkill.Arg.Node.TARGET_LABEL,
        CustomSkill.Arg.Node.UNITS,
        CustomSkill.Arg.Node.BR,
        CustomSkill.Arg.Node.NUMBER_ARG_1,
    ]
);

makeCustomSkillsOnMap(
    'neutralizes-targets-n-bonus-effects-node',
    '有利な状態異常をn個解除',
    args =>
        FOR_EACH_UNIT_NODE(
            CustomSkill.Arg.getUnitsNode(args),
            NEUTRALIZES_TARGETS_N_BONUS_EFFECTS_NODE(CustomSkill.Arg.getNumberNode(args, CustomSkill.Arg.Node.NUMBER_ARG_1)),
        ),
    [
        // 対象
        CustomSkill.Arg.Node.TARGET_LABEL,
        CustomSkill.Arg.Node.UNITS,
        CustomSkill.Arg.Node.BR,
        CustomSkill.Arg.Node.NUMBER_ARG_1,
    ]
);

makeCustomSkillsOnMap(
    'destroys-offence-safety-fence',
    '攻撃の安全柵を破壊する',
    args => DESTROYS_OFFENCE_SAFETY_FENCE_NODE,
    []
)

CustomSkill.setFuncId(
    'after-start-of-player-phase-if-has-stall-cancel-move-plus-1',
    "ターン開始時スキル後、空転が付与されている場合、移動+1を解除",
    (skillId, args) => {
        AFTER_START_OF_TURN_EFFECTS_TRIGGER_ON_PLAYER_PHASE_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
            IF_NODE(HAS_TARGET_STATUS_EFFECT_NODE(StatusEffectType.Stall),
                CANCELS_STATUS_EFFECTS_GRANTED_TO_TARGET_NODE(StatusEffectType.MobilityIncreased),
            ),
        ));
    },
    [],
);

makeCustomSkillsOnMap(
    'grants-additional-stat-bonus-to-each-stat-node',
    '強化を受けていれば強化を+nした値を付与（上限m）',
    args =>
        FOR_EACH_UNIT_NODE(
            CustomSkill.Arg.getUnitsNode(args),
            GRANTS_ADDITIONAL_STAT_BONUS_TO_EACH_STAT_NODE(
                CustomSkill.Arg.getStatBonus(args),
                CustomSkill.Arg.getNumberNode(args, CustomSkill.Arg.Node.MAX)
            ),
        ),
    [
        // 対象
        CustomSkill.Arg.Node.TARGET_LABEL,
        CustomSkill.Arg.Node.UNITS,
        CustomSkill.Arg.Node.BR,

        // 強化
        CustomSkill.Arg.Node.STAT_BONUS_LABEL,
        CustomSkill.Arg.Node.STAT_BONUS,
        CustomSkill.Arg.Node.BR,

        // 最大
        CustomSkill.Arg.Node.MAX_LABEL,
        CustomSkill.Arg.Node.MAX,
    ],
);

makeCustomSkillsOnMap(
    'restores-hp',
    '対象を回復',
    args =>
        FOR_EACH_UNIT_NODE(
            CustomSkill.Arg.getUnitsNode(args),
            RESTORE_TARGETS_HP_ON_MAP_NODE(CustomSkill.Arg.getTotalNonNegativeIntegerNode(args)),
        ),
    [
        // 対象
        CustomSkill.Arg.Node.TARGET_LABEL,
        CustomSkill.Arg.Node.UNITS,
        CustomSkill.Arg.Node.BR,
        ...NON_NEGATIVE_INTEGER_ARGS
    ],
);

// TODO: 他の再行動が発動した場合発動済みになる再行動も実装する(GRANTS_ANOTHER_ACTION_TO_TARGET_ONCE_PER_TURN_ON_ASSIST_IF_ANOTHER_ACTION_EFFECT_IS_NOT_ACTIVATED_NODE)
makeCustomSkillsOnMap(
    'grants-another-action',
    '対象を行動可能にする（再行動）',
    args =>
        GRANTS_ANOTHER_ACTION_TO_TARGET_ONCE_PER_TURN_ON_ASSIST_NODE,
    [
        // 対象
        CustomSkill.Arg.Node.TARGET_LABEL,
        CustomSkill.Arg.Node.UNITS,
        CustomSkill.Arg.Node.BR,
    ],
);

makeCustomSkillsOnMap(
    'applies-divine-vein-on-n-spaces-in-a-line-centered-on-foes-space',
    '天脈を付与',
    args =>
        FOR_EACH_SPACES_NODE(
            CustomSkill.Arg.getSpacesFuncNode(args)(CustomSkill.Arg.getNumber(args, CustomSkill.Arg.Node.NUMBER_ARG_1)),
            APPLY_DIVINE_VEIN_NODE(
                CustomSkill.Arg.getNumber(args, CustomSkill.Arg.Node.DIVINE_VEIN_TYPE),
                TARGET_GROUP_NODE,
                CustomSkill.Arg.getNumber(args, CustomSkill.Arg.Node.NUMBER_ARG_2),
            ),
        ),
    [
        // 対象
        CustomSkill.Arg.Node.TARGET_LABEL,
        CustomSkill.Arg.Node.TARGET_SPACES,
        CustomSkill.Arg.Node.DIVINE_VEIN_TYPE,
        CustomSkill.Arg.Node.BR,
        CustomSkill.Arg.Node.SPACES_LABEL,
        CustomSkill.Arg.Node.NUMBER_ARG_1,
        CustomSkill.Arg.Node.BR,
        CustomSkill.Arg.Node.TURN_LABEL,
        CustomSkill.Arg.Node.NUMBER_ARG_2,
    ],
);

CustomSkill.setFuncId(
    'divine-nectar-another-action',
    "蜜による再行動効果（ヘイズルーン効果）",
    (skillId, args) => {
        setDivineNectarAnotherActionSkill(skillId);
    },
    []
)

CustomSkill.setFuncId(
    'canto-assist',
    "再移動時、nを発動可能",
    (skillId, args) => {
        WHEN_CANTO_TRIGGERS_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
            ENABLES_TARGET_TO_USE_CANTO_ASSIST_ON_TARGETS_ALLY_NODE(
                CustomSkill.Arg.getAssistTypeNode(args),
                CustomSkill.Arg.getCantoAssistTypesNode(args),
                CustomSkill.Arg.getTotalNonNegativeIntegerNode(args),
            ),
        ));
    },
    [
        CustomSkill.Arg.Node.ASSIST_LABEL,
        CustomSkill.Arg.Node.ASSIST_TYPE,

        CustomSkill.Arg.Node.CANTO_ASSIST_LABEL,
        CustomSkill.Arg.Node.CANTO_ASSIST_TYPE,

        CustomSkill.Arg.Node.RANGE_LABEL,
        CustomSkill.Arg.Node.NON_NEGATIVE_INTEGER,
    ],
);

CustomSkill.setFuncId(
    'canto-assist-reposition',
    "再移動時、引き戻しを発動可能",
    (skillId, args) => {
        WHEN_CANTO_TRIGGERS_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
            ENABLES_TARGET_TO_USE_CANTO_ASSIST_ON_TARGETS_ALLY_NODE(
                AssistType.Move,
                CantoSupport.Reposition,
                1,
            ),
        ));
    },
    [],
);

CustomSkill.setFuncId(
    'canto-assist-remote-swap',
    "再移動時、遠隔入れ替えを発動可能",
    (skillId, args) => {
        WHEN_CANTO_TRIGGERS_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
            ENABLES_TARGET_TO_USE_CANTO_ASSIST_ON_TARGETS_ALLY_NODE(
                AssistType.Move,
                CantoSupport.Swap,
                2,
            ),
        ));
    },
    [],
);

CustomSkill.setFuncId(
    'canto-assist-smite',
    "再移動時、ぶちかましを発動可能",
    (skillId, args) => {
        WHEN_CANTO_TRIGGERS_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
            ENABLES_TARGET_TO_USE_CANTO_ASSIST_ON_TARGETS_ALLY_NODE(
                AssistType.Move,
                CantoSupport.Smite,
                1,
            ),
        ));
    },
    [],
);

CustomSkill.setFuncId(
    'canto-assist-trick',
    "再移動時、トリックを発動可能",
    (skillId, args) => {
        WHEN_CANTO_TRIGGERS_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
            ENABLES_TARGET_TO_USE_CANTO_ASSIST_ON_TARGETS_ALLY_NODE(
                AssistType.Move,
                CantoSupport.Swap,
                3,
            ),
        ));
    },
    [],
);

CustomSkill.setFuncId(
    'canto-assist-sing-dance',
    "再移動時、歌う・踊るを発動可能",
    (skillId, args) => {
        WHEN_CANTO_TRIGGERS_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
            ENABLES_TARGET_TO_USE_CANTO_ASSIST_ON_TARGETS_ALLY_NODE(
                AssistType.Refresh,
                CantoSupport.SingDance,
                1,
            ),
        ));
    },
    [],
);

CustomSkill.setFuncId(
    'has-pathfinder',
    "天駆の道",
    (skillId, args) => {
        HAS_PATHFINDER_HOOKS.addSkill(skillId, () => TRUE_NODE);
    },
    []
);

CustomSkill.setFuncId(
    'when-cant-ally-within-6-can-move-to-a-space-within-2',
    "味方は再移動時、スキル所有者の6マス以内にいればスキル所有者の2マス以内に移動可能",
    (skillId, args) => {
        WHEN_CANTO_ALLY_CAN_MOVE_TO_A_SPACE_HOOKS.addSkill(skillId, () =>
            SPACES_IF_NODE(
                IS_TARGET_WITHIN_6_SPACES_OF_SKILL_OWNER_NODE,
                SPACES_WITHIN_N_SPACES_OF_SKILL_OWNER_NODE(2),
            ),
        );
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

CustomSkill.setFuncId(
    'vengeful-god',
    '復讐の神形',
    (skillId, args) => {
        SET_SKILL_FUNCS.get(Weapon.VengefulGod)?.(skillId);
    },
    []
);

CustomSkill.setFuncId(
    'enraptured-god',
    '陶酔の神形',
    (skillId, args) => {
        SET_SKILL_FUNCS.get(Weapon.EnrapturedGod)?.(skillId);
    },
    []
);

CustomSkill.setFuncId(
    'increases-spd-diff-necessary-for-foes-follow-up-node',
    '敵の追撃の速さ条件+',
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkillIfAbsent(skillId, () =>
            INCREASES_SPD_DIFF_NECESSARY_FOR_TARGETS_FOES_TO_MAKE_FOLLOW_UP_NODE(
                CustomSkill.Arg.getTotalNonNegativeIntegerNode(args)
            ),
        );
    },
    NON_NEGATIVE_INTEGER_ARGS,
);

CustomSkill.setFuncId(
    'bolt-axe-bug',
    'ボルトアクス（バグ効果）',
    (skillId, args) => {
        FOR_FOES_AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
            IF_NODE(IS_TARGET_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_SKILL_OWNER_NODE,
                // 本来スキル効果にない
                // 「敵の絶対追撃を無効」
                UNIT_NEUTRALIZES_EFFECTS_THAT_GUARANTEE_FOES_FOLLOW_UP_ATTACKS_DURING_COMBAT_NODE,
                // 「自身の奥義発動カウント変動量ーを無効」
                NEUTRALIZES_EFFECTS_THAT_INFLICT_SPECIAL_COOLDOWN_CHARGE_MINUS_X_ON_UNIT,
                // 「戦闘中、自身の奥義発動カウント変動量＋1（同系統効果複数時、最大値適用）」効果が発動する
                GRANTS_SPECIAL_COOLDOWN_CHARGE_PLUS_1_TO_UNIT_PER_ATTACK_DURING_COMBAT_NODE,
            ),
        ));
    },
    []
);
