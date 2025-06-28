// TODO: phase情報を入れる
/**
 * 戦闘開始時
 * @type {SkillEffectHooks<SkillEffectNode, DamageCalculatorWrapperEnv>} */
const AT_START_OF_COMBAT_HOOKS = new SkillEffectHooks();

/**
 * 再移動条件
 * @type {SkillEffectHooks<BoolNode, BattleSimulatorBaseEnv>} */
const CAN_TRIGGER_CANTO_HOOKS = new SkillEffectHooks();

/**
 * 再移動量
 * @type {SkillEffectHooks<NumberNode, CantoEnv>} */
const CALCULATES_DISTANCE_OF_CANTO_HOOKS = new SkillEffectHooks();

/**
 * 再移動制限時の再移動量
 * @type {SkillEffectHooks<NumberNode, CantoEnv>} */
const CALCULATES_DISTANCE_OF_CANTO_WHEN_CANTO_CONTROL_IS_APPLIED_HOOKS = new SkillEffectHooks();

/**
 * ワープでの再移動
 * @type {SkillEffectHooks<SpacesNode, BattleMapEnv>} */
const WHEN_CANTO_UNIT_CAN_MOVE_TO_A_SPACE_HOOKS = new SkillEffectHooks();

/**
 * ワープでの再移動（味方）
 * @type {SkillEffectHooks<SpacesNode, BattleMapEnv>} */
const WHEN_CANTO_ALLY_CAN_MOVE_TO_A_SPACE_HOOKS = new SkillEffectHooks();

/**
 * 再移動発動開始時
 * @type {SkillEffectHooks<SkillEffectNode, CantoEnv>} */
const WHEN_CANTO_TRIGGERS_HOOKS = new SkillEffectHooks();

/**
 * ターン開始時
 * @type {SkillEffectHooks<SkillEffectNode, AtStartOfTurnEnv>} */
const AT_START_OF_TURN_HOOKS = new SkillEffectHooks();

/**
 * 敵軍ターン開始時
 * @type {SkillEffectHooks<SkillEffectNode, AtStartOfTurnEnv>} */
const AT_START_OF_ENEMY_PHASE_HOOKS = new SkillEffectHooks();

/**
 * HP反映後ターン開始時
 * @type {SkillEffectHooks<SkillEffectNode, AtStartOfTurnEnv>} */
const AT_START_OF_TURN_AFTER_HEALING_AND_DAMAGE_HOOKS = new SkillEffectHooks();

/**
 * HP反映後敵軍ターン開始時
 * @type {SkillEffectHooks<SkillEffectNode, AtStartOfTurnEnv>} */
const AT_START_OF_ENEMY_PHASE_AFTER_HEALING_AND_DAMAGE_SKILLS_HOOKS = new SkillEffectHooks();

/**
 * 敵軍のターン開始時スキル発動後
 * @type {SkillEffectHooks<SkillEffectNode, AtStartOfTurnEnv>} */
const AFTER_START_OF_TURN_EFFECTS_TRIGGER_ON_PLAYER_PHASE_HOOKS = new SkillEffectHooks();

/**
 * 敵軍のターン開始時スキル発動後
 * @type {SkillEffectHooks<SkillEffectNode, AtStartOfTurnEnv>} */
const AFTER_START_OF_TURN_EFFECTS_TRIGGER_ON_ENEMY_PHASE_HOOKS = new SkillEffectHooks();

/**
 * 攻撃キャンセル
 * ターゲットは攻撃したユニット
 * @type {SkillEffectHooks<BoolNode, NodeEnv>}
 */
const CANCEL_FOES_ATTACK_HOOKS = new SkillEffectHooks();

/**
 * 攻撃キャンセル後のスキル効果
 * ターゲットは攻撃したユニット
 * @type {SkillEffectHooks<SkillEffectNode, NodeEnv>}
 */
const AFTER_CANCEL_FOES_ATTACK_HOOKS = new SkillEffectHooks();

/**
 * 範囲奥義判定前(主に範囲奥義を発動するかどうかの判定など)
 * @type {SkillEffectHooks<SkillEffectNode, DamageCalculatorWrapperEnv>} */
const BEFORE_AOE_SPECIAL_ACTIVATION_CHECK_HOOKS = new SkillEffectHooks();

/**
 * 戦闘開始前
 * @type {SkillEffectHooks<SkillEffectNode, DamageCalculatorWrapperEnv>} */
const BEFORE_COMBAT_HOOKS = new SkillEffectHooks();

/**
 * 再移動制限評価時
 * @type {SkillEffectHooks<BoolNode, CantoControlEnv>} */
const CAN_INFLICT_CANTO_CONTROL_HOOKS = new SkillEffectHooks();

/**
 * TODO: ステータス付与時に汎用的に使用できるフックに修正する
 * ステータス付与時
 * @type {SkillEffectHooks<BoolNode, PreventingStatusEffectEnv>} */
const CAN_NEUTRALIZE_STATUS_EFFECTS_HOOKS = new SkillEffectHooks();

/**
 * スキルによる行動停止無効
 * @type {SkillEffectHooks<BoolNode, NeutralizingEndActionEnv>} */
const CAN_NEUTRALIZE_END_ACTION_BY_SKILL_EFFECTS_HOOKS = new SkillEffectHooks();

/**
 * ステータスによる行動停止無効
 * @type {SkillEffectHooks<BoolNode, NeutralizingEndActionEnv>} */
const CAN_NEUTRALIZE_END_ACTION_BY_STATUS_EFFECTS_HOOKS = new SkillEffectHooks();

/**
 * 周囲に対する紋章効果
 * @type {SkillEffectHooks<SkillEffectNode, ForAlliesEnv>} */
const FOR_ALLIES_GRANTS_STATS_PLUS_TO_ALLIES_DURING_COMBAT_HOOKS = new SkillEffectHooks();

/**
 * 周囲に対するスキル効果
 * @type {SkillEffectHooks<SkillEffectNode, ForAlliesEnv>} */
const FOR_ALLIES_GRANTS_EFFECTS_TO_ALLIES_DURING_COMBAT_HOOKS = new SkillEffectHooks();

/**
 * 周囲に対するスキル効果(適用後)
 * @type {SkillEffectHooks<SkillEffectNode, ForAlliesEnv>} */
const FOR_ALLIES_GRANTS_EFFECTS_TO_ALLIES_AFTER_OTHER_SKILLS_DURING_COMBAT_HOOKS = new SkillEffectHooks();

/**
 * 周囲に対するスキル効果(戦闘後)
 * @type {SkillEffectHooks<SkillEffectNode, ForAlliesEnv>} */
const FOR_ALLIES_GRANTS_EFFECTS_TO_ALLIES_AFTER_COMBAT_HOOKS = new SkillEffectHooks();

// TODO: 周囲に対する紋章・スキル効果と命名規則が同じになるようにする
/**
 * 周囲の敵から受ける紋章効果。targetがデバフを受けるユニット
 * @type {SkillEffectHooks<SkillEffectNode, ForFoesEnv>} */
const WHEN_INFLICTS_STATS_MINUS_TO_FOES_HOOKS = new SkillEffectHooks();

/**
 * 周囲の敵から受けるスキル効果
 * @type {SkillEffectHooks<SkillEffectNode, ForFoesEnv>} */
const WHEN_INFLICTS_EFFECTS_TO_FOES_HOOKS = new SkillEffectHooks();

/**
 * 周囲の敵から受けるスキル効果（適用後）
 * @type {SkillEffectHooks<SkillEffectNode, ForFoesEnv>} */
const WHEN_INFLICTS_EFFECTS_TO_FOES_AFTER_OTHER_SKILLS_HOOKS = new SkillEffectHooks();

/**
 * ボタンを押したときのスキル効果
 * @type {MultiValueMap<number, SkillEffectNode>} */
const WHEN_TRIGGERS_DUO_OR_HARMONIZED_EFFECT_HOOKS_MAP = new MultiValueMap();

/**
 * ボタンを押したときのスキル効果
 * @type {SkillEffectHooks<SkillEffectNode, EnumerationEnv>} */
const WHEN_TRIGGERS_DUO_OR_HARMONIZED_EFFECT_HOOKS = new SkillEffectHooks();

/**
 * ボタンを押せるかどうか
 * @type {MultiValueMap<number, BoolNode>} */
const CAN_TRIGGER_DUO_OR_HARMONIZED_EFFECT_HOOKS_MAP = new MultiValueMap();

/**
 * 神速追撃
 * @type {SkillEffectHooks<SkillEffectNode, DamageCalculatorWrapperEnv>} */
const WHEN_APPLIES_POTENT_EFFECTS_HOOKS = new SkillEffectHooks();

/**
 * 護り手判定時
 * targetは護られるユニット、護り手はally、攻撃した敵はfoe
 * @type {SkillEffectHooks<SkillEffectNode, DamageCalculatorWrapperEnv>} */
const CAN_TRIGGER_SAVIOR_HOOKS = new SkillEffectHooks();

/**
 * 戦闘後
 * @type {SkillEffectHooks<SkillEffectNode, AfterCombatEnv>} */
const AFTER_COMBAT_HOOKS = new SkillEffectHooks();

/**
 * 戦闘後(HP確定後)
 * @type {SkillEffectHooks<SkillEffectNode, AfterCombatEnv>} */
const AFTER_COMBAT_AFTER_HEAL_OR_DAMAGE_HOOKS = new SkillEffectHooks();

/**
 * 戦闘後(死んでも発動)
 * @type {SkillEffectHooks<SkillEffectNode, AfterCombatEnv>} */
const AFTER_COMBAT_NEVERTHELESS_HOOKS = new SkillEffectHooks();

/**
 * 戦闘後(攻撃していれば)
 * @type {SkillEffectHooks<SkillEffectNode, AfterCombatEnv>} */
const AFTER_COMBAT_IF_UNIT_ATTACKED_HOOKS = new SkillEffectHooks();

/**
 * 戦闘後周囲からのスキル効果
 * @type {SkillEffectHooks<SkillEffectNode, AfterCombatEnv>} */
const FOR_ALLIES_AFTER_COMBAT_HOOKS = new SkillEffectHooks();

/**
 * 戦闘ステータス決定後のバフ
 * @type {SkillEffectHooks<SkillEffectNode, DamageCalculatorWrapperEnv>} */
const WHEN_APPLIES_EFFECTS_TO_STATS_AFTER_COMBAT_STATS_DETERMINED_HOOKS = new SkillEffectHooks();

/**
 * 戦闘ステータス決定後のスキル効果
 * @type {SkillEffectHooks<SkillEffectNode, DamageCalculatorWrapperEnv>} */
const WHEN_APPLIES_EFFECTS_AFTER_COMBAT_STATS_DETERMINED_HOOKS = new SkillEffectHooks();

/**
 * 戦闘開始時奥義
 * @type {SkillEffectHooks<SkillEffectNode, DamageCalculatorWrapperEnv>} */
const WHEN_APPLIES_SPECIAL_EFFECTS_AT_START_OF_COMBAT_HOOKS = new SkillEffectHooks();

/**
 * 攻撃開始時(攻撃ごとのスキル効果)
 * @type {SkillEffectHooks<SkillEffectNode, DamageCalculatorEnv>} */
const AT_START_OF_ATTACK_HOOKS = new SkillEffectHooks();

/**
 * 行動後or再移動後
 * @type {SkillEffectHooks<SkillEffectNode, NodeEnv>} */
const AFTER_UNIT_ACTS_IF_CANTO_TRIGGERS_AFTER_CANTO_HOOKS = new SkillEffectHooks();

/**
 * 再移動後
 * @type {SkillEffectHooks<SkillEffectNode, NodeEnv>} */
const AFTER_CANTO_HOOKS = new SkillEffectHooks();

/**
 * 追撃判定後
 * @type {SkillEffectHooks<SkillEffectNode, DamageCalculatorWrapperEnv>} */
const AFTER_FOLLOW_UP_CONFIGURED_HOOKS = new SkillEffectHooks();

/**
 * ステータス比較時(虚勢など)
 * @type {SkillEffectHooks<StatsNode, NodeEnv>} */
const AT_COMPARING_STATS_HOOKS = new SkillEffectHooks();

/**
 * 戦闘後の再行動評価時
 * @type {SkillEffectHooks<SkillEffectNode, BattleSimulatorBaseEnv>} */
const AFTER_COMBAT_FOR_ANOTHER_ACTION_HOOKS = new SkillEffectHooks();

/**
 * 戦闘後の再行動評価時
 * 敵（攻撃者）から見た視点になる（targetはatkUnit、skill ownerはdefUnit）。
 * @type {SkillEffectHooks<SkillEffectNode, BattleSimulatorBaseEnv>} */
const AFTER_COMBAT_FOR_FOES_ANOTHER_ACTION_HOOKS = new SkillEffectHooks();

/**
 * 戦闘以外の行動後の再行動評価時
 * @type {SkillEffectHooks<SkillEffectNode, BattleSimulatorBaseEnv>} */
const AFTER_ACTION_WITHOUT_COMBAT_FOR_ANOTHER_ACTION_HOOKS = new SkillEffectHooks();

/**
 * 範囲奥義前（範囲奥義発動直前）
 * @type {SkillEffectHooks<SkillEffectNode, DamageCalculatorWrapperEnv>} */
const BEFORE_AOE_SPECIAL_HOOKS = new SkillEffectHooks();

/**
 * 1戦闘1回の奥義によるダメージ軽減
 * ターゲットはダメージを受ける側のユニット
 * @type {SkillEffectHooks<SkillEffectNode, DamageCalculatorEnv>} */
const AT_APPLYING_ONCE_PER_COMBAT_DAMAGE_REDUCTION_HOOKS = new SkillEffectHooks();

/**
 * 応援を使用した時
 * @type {SkillEffectHooks<SkillEffectNode, BattleSimulatorBaseEnv>} */
const AFTER_RALLY_SKILL_IS_USED_BY_UNIT_HOOKS = new SkillEffectHooks();

/**
 * 応援を使用された時
 * @type {SkillEffectHooks<SkillEffectNode, BattleSimulatorBaseEnv>} */
const AFTER_RALLY_SKILL_IS_USED_BY_ALLY_HOOKS = new SkillEffectHooks();

/**
 * 移動補助を使用した時
 * @type {SkillEffectHooks<SkillEffectNode, BattleSimulatorBaseEnv>} */
const AFTER_MOVEMENT_SKILL_IS_USED_BY_UNIT_HOOKS = new SkillEffectHooks();

/**
 * 移動補助を使用された時
 * @type {SkillEffectHooks<SkillEffectNode, BattleSimulatorBaseEnv>} */
const AFTER_MOVEMENT_SKILL_IS_USED_BY_ALLY_HOOKS = new SkillEffectHooks();

/**
 * 再行動補助を使用した時
 * @type {SkillEffectHooks<SkillEffectNode, BattleSimulatorBaseEnv>} */
const AFTER_REFRESH_SKILL_IS_USED_BY_UNIT_HOOKS = new SkillEffectHooks();

/**
 * 再行動補助を使用された時
 * @type {SkillEffectHooks<SkillEffectNode, BattleSimulatorBaseEnv>} */
const AFTER_REFRESH_SKILL_IS_USED_BY_ALLY_HOOKS = new SkillEffectHooks();

/**
 * 応援を使用して行動を終えた後
 * @type {SkillEffectHooks<SkillEffectNode, BattleSimulatorBaseEnv>} */
const AFTER_RALLY_ENDED_BY_UNIT_HOOKS = new SkillEffectHooks();

/**
 * 応援を使用されて行動を終えた後
 * @type {SkillEffectHooks<SkillEffectNode, BattleSimulatorBaseEnv>} */
const AFTER_RALLY_ENDED_BY_ALLY_HOOKS = new SkillEffectHooks();

/**
 * 自分以外の誰かが応援を使用して行動を終えた後（敵味方問わず）
 * @type {SkillEffectHooks<SkillEffectNode, BattleSimulatorBaseEnv>} */
const AFTER_RALLY_ENDED_BY_OTHER_UNIT_HOOKS = new SkillEffectHooks();

/**
 * 移動補助を使用して行動を終えた後
 * @type {SkillEffectHooks<SkillEffectNode, BattleSimulatorBaseEnv>} */
const AFTER_MOVEMENT_ASSIST_ENDED_BY_UNIT_HOOKS = new SkillEffectHooks();

/**
 * 移動補助を使用されて行動を終えた後
 * @type {SkillEffectHooks<SkillEffectNode, BattleSimulatorBaseEnv>} */
const AFTER_MOVEMENT_ASSIST_ENDED_BY_ALLY_HOOKS = new SkillEffectHooks();

/**
 * 自分以外の誰かが移動補助を使用して行動を終えた後（敵味方問わず）
 * @type {SkillEffectHooks<SkillEffectNode, BattleSimulatorBaseEnv>} */
const AFTER_MOVEMENT_ASSIST_ENDED_BY_OTHER_UNIT_HOOKS = new SkillEffectHooks();

/**
 * TODO: rename
 * AIの天脈処理
 */
const HAS_DIVINE_VEIN_SKILLS_WHEN_ACTION_DONE_HOOKS = new SkillEffectHooks();

/**
 * ターン開始時の化身のタイミング
 * @type {SkillEffectHooks<SkillEffectNode, AtStartOfTurnEnv>} */
const CAN_TRANSFORM_AT_START_OF_TURN__HOOKS = new SkillEffectHooks();

/**
 * 敵ターン開始時の化身のタイミング
 * @type {SkillEffectHooks<SkillEffectNode, AtStartOfTurnEnv>} */
const CAN_TRANSFORM_AT_START_OF_ENEMY_TURN__HOOKS = new SkillEffectHooks();

/**
 * Unit can move to a space
 * @type {SkillEffectHooks<SpacesNode, BattleMapEnv>} */
const UNIT_CAN_MOVE_TO_A_SPACE_HOOKS = new SkillEffectHooks();

/**
 * Ally can move to a space
 * @type {SkillEffectHooks<SpacesNode, BattleMapEnv>} */
const ALLY_CAN_MOVE_TO_A_SPACE_HOOKS = new SkillEffectHooks();

/**
 * unit can move through foes' spaces.
 * @type {SkillEffectHooks<BoolNode, NodeEnv>} */
const UNIT_CAN_MOVE_THROUGH_FOES_SPACES_HOOKS = new SkillEffectHooks();

/**
 * Foes cannot warp into spaces
 * @type {SkillEffectHooks}
 */
const UNIT_CANNOT_WARP_INTO_SPACES_HOOKS = new SkillEffectHooks();

/**
 * 戦闘開始後ダメージ後の回復
 * @type {SkillEffectHooks<SkillEffectNode, DamageCalculatorWrapperEnv>} */
const AFTER_EFFECTS_THAT_DEAL_DAMAGE_AS_COMBAT_BEGINS_HOOKS = new SkillEffectHooks();

/**
 * 周囲からの戦闘開始後ダメージ後の回復
 * @type {SkillEffectHooks<SkillEffectNode, DamageCalculatorWrapperEnv>} */
const FOR_ALLIES_AFTER_EFFECTS_THAT_DEAL_DAMAGE_AS_COMBAT_BEGINS_HOOKS = new SkillEffectHooks();

/**
 * Foes with Range = 1 cannot move through spaces adjacent to unit (does not affect foes with Pass skills).
 * @type {SkillEffectHooks<BoolNode, NodeEnv>} */
const CANNOT_FOE_MOVE_THROUGH_SPACES_ADJACENT_TO_UNIT_HOOKS = new SkillEffectHooks();

/**
 * Foes with Range = 2 cannot move through spaces adjacent to unit (does not affect foes with Pass skills).
 * TODO: 2距離のチェックは内部で行なっているが2距離以外も阻止できるなら修正する
 * @type {SkillEffectHooks<BoolNode, NodeEnv>} */
const CANNOT_FOE_MOVE_THROUGH_SPACES_WITHIN_2_SPACES_OF_UNIT_HOOKS = new SkillEffectHooks();

/**
 * @type {SkillEffectHooks<SpacesNode, NodeEnv>} */
const AOE_SPECIAL_SPACES_HOOKS = new SkillEffectHooks();

/**
 * @type {SkillEffectHooks<NumberNode, NodeEnv>} */
const CALC_HEAL_AMOUNT_HOOKS = new SkillEffectHooks();

/**
 * 移動が不可能になるスタイルの攻撃範囲を求めるときに呼び出される。
 * @type {SkillEffectHooks<SpacesNode, NodeEnv>} */
const CANNOT_MOVE_STYLE_ATTACK_RANGE_HOOKS = new SkillEffectHooks();

/**
 * @type {SkillEffectHooks<BoolNode, NodeEnv>}
 */
const CAN_ACTIVATE_STYLE_HOOKS = new SkillEffectHooks();

/**
 * スタイル発動後に呼び出される。クールタイムの設定などに使用。
 * @type {SkillEffectHooks<SkillEffectNode, NodeEnv>}
 */
const STYLE_ACTIVATED_HOOKS = new SkillEffectHooks();

/**
 * スタイル時に反撃を受ける条件
 * @type {SkillEffectHooks<BoolNode, DamageCalculatorWrapperEnv>}
 */
const SUFFERS_COUNTERATTACK_DURING_STYLE_HOOKS = new SkillEffectHooks();

/**
 * @type {SkillEffectHooks<NumberNode, NodeEnv>}
 */
const CAN_ATTACK_FOES_N_SPACES_AWAY_DURING_STYLE_HOOKS = new SkillEffectHooks();

/**
 * @type {SkillEffectHooks<NumberNode, NodeEnv>}
 */
const CAN_ATTACK_FOES_N_SPACES_AWAY_HOOKS = new SkillEffectHooks();

/**
 * @type {SkillEffectHooks<NumberNode, NodeEnv>}
 */
const SKILLS_EFFECTS_RANGE_IS_TREATED_AS_N_HOOKS = new SkillEffectHooks();
