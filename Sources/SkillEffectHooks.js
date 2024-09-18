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
 * ターン開始時
 * @type {SkillEffectHooks<SkillEffectNode, AtStartOfTurnEnv>} */
const AT_START_OF_TURN_HOOKS = new SkillEffectHooks();

/**
 * 敵軍ターン開始時
 * @type {SkillEffectHooks<SkillEffectNode, AtStartOfTurnEnv>} */
const AT_START_OF_ENEMY_PHASE_HOOK = new SkillEffectHooks();

/**
 * 戦闘前
 * @type {SkillEffectHooks<SkillEffectNode, DamageCalculatorWrapperEnv>} */
const PRE_COMBAT_HOOKS = new SkillEffectHooks();

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
 * 周囲の敵から受ける紋章効果
 * @type {SkillEffectHooks<SkillEffectNode, ForFoesEnv>} */
const WHEN_INFLICTS_STATS_MINUS_TO_FOES_HOOKS = new SkillEffectHooks();

/**
 * ボタンを押したときのスキル効果
 * @type {MultiValueMap<number, SkillEffectNode>} */
const WHEN_TRIGGERS_DUO_OR_HARMONIZED_EFFECT_HOOKS_MAP = new MultiValueMap();

/**
 * 神速追撃
 * @type {SkillEffectHooks<SkillEffectNode, DamageCalculatorWrapperEnv>} */
const WHEN_APPLIES_POTENT_EFFECTS_HOOKS = new SkillEffectHooks();

/**
 * 戦闘後
 * @type {SkillEffectHooks<SkillEffectNode, AfterCombatEnv>} */
const AFTER_COMBAT_HOOKS = new SkillEffectHooks();

/**
 * 戦闘後(死んでも発動)
 * @type {SkillEffectHooks<SkillEffectNode, AfterCombatEnv>} */
const AFTER_COMBAT_NEVERTHELESS_HOOKS = new SkillEffectHooks();

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
 * 戦闘以外の行動後の再行動評価時
 * @type {SkillEffectHooks<SkillEffectNode, BattleSimulatorBaseEnv>} */
const AFTER_ACTION_WITHOUT_COMBAT_FOR_ANOTHER_ACTION_HOOKS = new SkillEffectHooks();

/**
 * 戦闘以外の行動後の再行動評価時
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
 * TODO: rename
 * AIの天脈処理
 */
const HAS_DIVINE_VEIN_SKILLS_WHEN_ACTION_DONE_HOOKS = new SkillEffectHooks();

/**
 * ターン開始時の化身のタイミング
 * @type {SkillEffectHooks<SkillEffectNode, AtStartOfTurnEnv>} */
const AT_TRANSFORMATION_PHASE_HOOKS = new SkillEffectHooks();

/**
 * Unit can move to a space
 * @type {SkillEffectHooks<ForSpacesNode, BattleMapEnv>} */
const UNIT_CAN_MOVE_TO_A_SPACE_HOOKS = new SkillEffectHooks();

/**
 * unit can move through foes' spaces.
 * @type {SkillEffectHooks<ForSpacesNode, NodeEnv>} */
const UNIT_CAN_MOVE_THROUGH_FOES_SPACES_HOOKS = new SkillEffectHooks();

/**
 * unit can move through foes' spaces.
 * @type {SkillEffectHooks<SkillEffectNode, DamageCalculatorWrapperEnv>} */
const AFTER_EFFECTS_THAT_DEAL_DAMAGE_AS_COMBAT_BEGINS_HOOKS = new SkillEffectHooks();

/**
 * Foes with Range = 1 cannot move through spaces adjacent to unit (does not affect foes with Pass skills).
 * @type {SkillEffectHooks<BoolNode, NodeEnv>} */
const CANNOT_FOE_MOVE_THROUGH_SPACES_ADJACENT_TO_UNIT_HOOKS = new SkillEffectHooks();

/**
 * Foes with Range = 2 cannot move through spaces adjacent to unit (does not affect foes with Pass skills).
 * @type {SkillEffectHooks<BoolNode, NodeEnv>} */
const CANNOT_FOE_MOVE_THROUGH_SPACES_WITHIN_2_SPACES_OF_UNIT_HOOKS = new SkillEffectHooks();
