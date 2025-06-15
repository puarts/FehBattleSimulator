/**
 * funcIdから動的スキル登録を行う関数のマップ
 * @type {Map<string, function(number|string, Object)>}
 */
const CUSTOM_SKILL_FUNC_MAP = new Map();

/**
 * 動的に登録済みのスキルIDの集合
 * @type {Set<any>}
 */
let registeredCustomSkillIds = new Set();

/**
 * 動的スキルの引数のタイプの一覧
 */
const CUSTOM_SKILL_ARG_TYPE = {
    NONE: "none",
    NON_NEGATIVE_INTEGER: "non_negative_integer",
    PERCENTAGE: "percentage",
    EFFECTIVE_TYPE: "effective_type",
    STATUS_EFFECT_TYPE: "status_effective_type",
}

/**
 * カテゴリーデータの引数
 * @type {Set<string>}
 */
const CUSTOM_SKILL_CATEGORY_ARG_TYPES = [
    CUSTOM_SKILL_ARG_TYPE.EFFECTIVE_TYPE,
    CUSTOM_SKILL_ARG_TYPE.STATUS_EFFECT_TYPE,
];

/**
 * @type {MultiValueMap<string, string>}
 */
const FUNC_ID_TO_ARG_TYPES_MAP = new MultiValueMap();

/**
 * @type {MultiValueMap<string, Object>}
 */
const ARG_TYPE_TO_OPTIONS_MAP = new MultiValueMap();

/**
 * カスタムスキルのオプション。idはfuncId
 */
let CUSTOM_SKILL_OPTIONS = [];
CUSTOM_SKILL_OPTIONS.push({id: '', text: 'カスタムスキルを選択', disabled: true});
CUSTOM_SKILL_OPTIONS.push({id: NONE_ID, text: "なし"});

/// カスタムスキル関数
// 特効
/**
 * @param {string} funcId
 * @param {string} text
 * @param {function((number|string), Object)} func
 * @param {string[]} args
 */
function setFuncId(funcId, text, func, args) {
    CUSTOM_SKILL_OPTIONS.push({id: funcId, text: text});
    // 関数登録
    CUSTOM_SKILL_FUNC_MAP.set(funcId, func);
    // 引数設定
    for (let arg of args) {
        FUNC_ID_TO_ARG_TYPES_MAP.addValue(funcId, arg);
    }
}

// setFuncId('XXX', "YYY",
//     (skillId, args) => {
//     },
//     [
//     ],
// );

setFuncId('deals-damage-excluding-aoe', "ダメージ+（範囲除）",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkillIfAbsent(skillId, () =>
            DEALS_DAMAGE_X_NODE(args[CUSTOM_SKILL_ARG_TYPE.NON_NEGATIVE_INTEGER])
        );
    },
    [
        CUSTOM_SKILL_ARG_TYPE.NON_NEGATIVE_INTEGER,
    ],
);

setFuncId('reduces-damage-excluding-aoe', "ダメージ-（範囲除）",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkillIfAbsent(skillId, () =>
            REDUCES_DAMAGE_BY_N_NODE(args[CUSTOM_SKILL_ARG_TYPE.NON_NEGATIVE_INTEGER])
        );
    },
    [
        CUSTOM_SKILL_ARG_TYPE.NON_NEGATIVE_INTEGER,
    ],
);

setFuncId('reduces-damage-from-special-excluding-aoe', "奥義ダメージ-（範囲除）",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkillIfAbsent(skillId, () =>
            REDUCES_DAMAGE_WHEN_FOES_SPECIAL_EXCLUDING_AOE_SPECIAL_NODE(args[CUSTOM_SKILL_ARG_TYPE.NON_NEGATIVE_INTEGER])
        );
    },
    [
        CUSTOM_SKILL_ARG_TYPE.NON_NEGATIVE_INTEGER,
    ],
);

setFuncId('reduces-damage-by-x-percent-excluding-aoe', "ダメージ軽減（範囲除）",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkillIfAbsent(skillId, () =>
            REDUCES_DAMAGE_FROM_TARGETS_FOES_ATTACKS_BY_X_PERCENT_DURING_COMBAT_NODE(
                args[CUSTOM_SKILL_ARG_TYPE.PERCENTAGE],)
        );
    },
    [
        CUSTOM_SKILL_ARG_TYPE.PERCENTAGE,
    ],
);

setFuncId('reduces-damage-by-x-percent-by-special-excluding-aoe', "ダメージ軽減（奥義扱、範囲除）",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkillIfAbsent(skillId, () =>
            REDUCES_DAMAGE_FROM_TARGETS_FOES_ATTACKS_BY_X_PERCENT_BY_SPECIAL_NODE(
                args[CUSTOM_SKILL_ARG_TYPE.PERCENTAGE],)
        );
    },
    [
        CUSTOM_SKILL_ARG_TYPE.PERCENTAGE,
    ],
);

// 特効
setFuncId('effective-against', "特効",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkillIfAbsent(skillId, () => SKILL_EFFECT_NODE(
            EFFECTIVE_AGAINST_NODE(args[CUSTOM_SKILL_ARG_TYPE.EFFECTIVE_TYPE]),
        ));
    },
    [
        CUSTOM_SKILL_ARG_TYPE.EFFECTIVE_TYPE,
    ],
);

// 特効無効
setFuncId('neutralizes-effective-against-bonuses', "特効無効",
    (skillId, args) => {
        AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => SKILL_EFFECT_NODE(
            // Neutralizes "effective against" bonuses for all movement types.
            TARGET_NEUTRALIZES_EFFECTIVE_AGAINST_X_NODE(args[CUSTOM_SKILL_ARG_TYPE.EFFECTIVE_TYPE]),
        ));
    },
    [
        CUSTOM_SKILL_ARG_TYPE.EFFECTIVE_TYPE,
    ],
);

// setFuncId('XXX', "YYY",
//     (skillId, args) => {
//     },
//     [
//     ],
// );

/// 引数
// 特効タイプ
for (let [_key, value] of Object.entries(EffectiveType)) {
    let option = value === EffectiveType.None ?
        {id: '', text: '選択してください', disabled: true} :
        {id: value, text: EFFECTIVE_TYPE_NAMES.get(value)};
    ARG_TYPE_TO_OPTIONS_MAP.addValue(CUSTOM_SKILL_ARG_TYPE.EFFECTIVE_TYPE, option);
}

// ステータス状態
for (let [_key, value] of Object.entries(StatusEffectType)) {
    let option = value === StatusEffectType.None ?
        {id: '', text: '選択してください', disabled: true} :
        {id: value, text: STATUS_EFFECT_INFO_MAP.get(value)[1]};
    ARG_TYPE_TO_OPTIONS_MAP.addValue(CUSTOM_SKILL_ARG_TYPE.STATUS_EFFECT_TYPE, option);
}

// // オブジェクトから選択するタイプの引数。XXX, YYY, ZZZを変更
// for (let [_key, value] of Object.entries(XXX)) {
//     let option = value === XXX.None ?
//         {id: '', text: '選択してください', disabled: true} :
//         {id: value, text: YYY};
//     ARG_TYPE_TO_OPTIONS_MAP.addValue(CUSTOM_SKILL_ARG_TYPE.ZZZ, option);
// }

{
    let funcId = 'accelerates-special-trigger-cooldown-count–1';
    let skillId = getCustomSkillId(funcId, {});
    CUSTOM_SKILL_OPTIONS.push({id: funcId, text: "奥義が発動しやすい（最低1）"});
    ACCELERATES_SPECIAL_TRIGGER_SET.add(skillId);
}
