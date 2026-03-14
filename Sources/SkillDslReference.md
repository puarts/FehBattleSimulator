# Skill DSL Reference — スキルテキスト → DSLノード逆引き

スキルテキストの英語フレーズからDSLノード・Hook・登録メソッドを逆引きするためのリファレンス。

## 1. Hooks（タイミング別）

| スキルテキスト / 用途 | Hook |
|---|---|
| (戦闘中の効果全般) | `AT_START_OF_COMBAT_HOOKS` |
| (戦闘中、ステータス確定後) | `NON_STATS_SKILL_USING_STATS_HOOKS` |
| When Special triggers | `WHEN_APPLIES_SPECIAL_EFFECTS_AT_START_OF_COMBAT_HOOKS` |
| At start of turn | `AT_START_OF_TURN_HOOKS` |
| After combat | `AFTER_COMBAT_HOOKS` |
| (範囲奥義含む戦闘中効果) | `DURING_COMBAT_INCLUDING_AOE_HOOKS` |
| (味方への効果) | `FOR_ALLIES_AT_START_OF_COMBAT_HOOKS` |
| (敵への効果) | `FOR_FOES_AT_START_OF_COMBAT_HOOKS` |
| (1回限りダメージ軽減の適用時) | `AT_APPLYING_ONCE_PER_COMBAT_DAMAGE_REDUCTION_HOOKS` |

## 2. 登録メソッド

| パターン | メソッド |
|---|---|
| 自分への戦闘中効果 | `SkillEffectRegistrar.registerSkillsDuringCombat(skillId, cond, ...effects)` |
| 味方への戦闘中効果 | `SkillEffectRegistrar.registerSkillsForAlliesDuringCombat(skillId, cond, ...effects)` |
| 敵への戦闘中効果 | `SkillEffectRegistrar.registerSkillsForFoesDuringCombat(skillId, cond, ...effects)` |
| 奥義カウント・タイプ設定 | `setSpecialCountAndType(skillId, count, isInheritable, isNormalAttack, isDefense)` |

## 3. ダメージ軽減（最も混同しやすい領域）

| スキルテキスト | DSLノード |
|---|---|
| reduces damage from foe's attacks by N | `REDUCES_DAMAGE_FROM_FOES_ATTACKS_BY(N)` |
| reduces damage from foe's attacks by N% | `REDUCES_DAMAGE_FROM_TARGETS_FOES_ATTACKS_BY_X_PERCENT_DURING_COMBAT_NODE(N)` |
| reduces damage from foe's first attack by N (including "attacks twice") | `REDUCES_DAMAGE_FROM_FOES_FIRST_ATTACK_BY_N_DURING_COMBAT_INCLUDING_TWICE_NODE(N)` |
| reduces damage from foe's first attack by N% (including "attacks twice") | `REDUCES_DAMAGE_FROM_FOES_FIRST_ATTACK_BY_N_PERCENT_DURING_COMBAT_INCLUDING_TWICE_NODE(N)` |
| reduces damage by X% (by special, excluding AoE) | `REDUCES_DAMAGE_FROM_TARGETS_FOES_ATTACKS_BY_X_PERCENT_BY_SPECIAL_NODE(X)` |
| (twice per combat) — 奥義軽減の発動回数拡張 | `ANY_TARGETS_REDUCE_DAMAGE_EFFECT_ONLY_ONCE_CAN_BE_TRIGGERED_UP_TO_N_TIMES_PER_COMBAT_NODE(2)` |
| reduces damage from foe's next attack by N% (once per combat) | `REDUCES_DAMAGE_FROM_TARGETS_FOES_NEXT_ATTACK_BY_N_PERCENT_ONCE_PER_COMBAT_NODE(N)` ※要 `AT_APPLYING_ONCE_PER_COMBAT_DAMAGE_REDUCTION_HOOKS` |

## 4. ダメージ加算

| スキルテキスト | DSLノード |
|---|---|
| deals +N damage | `DEALS_DAMAGE(N)` |
| deals +N damage (excluding AoE) | `DEALS_DAMAGE(N).excludingAoe()` |
| boosts damage by unit's Def when Special triggers | `BOOSTS_DAMAGE_WHEN_SPECIAL_TRIGGERS_NODE(UNITS_DEF_NODE)` |
| boosts damage by X% of unit's Stat | `BOOSTS_DAMAGE_WHEN_SPECIAL_TRIGGERS_NODE(PERCENTAGE_NODE(X, UNITS_STAT_NODE))` |
| next attack deals damage = N% of foe's first-attack damage prior to reductions | `TARGETS_NEXT_ATTACK_DEALS_DAMAGE_X_PERCENT_OF_TARGETS_FORES_ATTACK_PRIOR_TO_REDUCTION_ONLY_HIGHEST_VALUE_APPLIED_AND_DOES_NOT_STACK_NODE(N)` |
| next attack deals damage = total damage reduced from foe's first attack | `TARGETS_NEXT_ATTACK_DEALS_DAMAGE_EQ_TOTAL_DAMAGE_REDUCED_FROM_TARGETS_FOES_FIRST_ATTACK_NODE` |

## 5. ステータス参照ノード

| ノード | 意味 | 用途 |
|---|---|---|
| `UNITS_DEF_NODE` | フェーズ自動判定 | 汎用 |
| `UNITS_DEF_DURING_COMBAT_NODE` | 戦闘中のDef（バフ込み） | 奥義ダメージ計算等 |
| `UNITS_EVAL_DEF_DURING_COMBAT_NODE` | 戦闘中の評価済みDef | ステータス比較条件 |
| `UNITS_DEF_AT_START_OF_COMBAT_NODE` | 戦闘開始時のDef | 開始時条件判定 |

※ Def以外のステータスも同パターン（`UNITS_ATK_*`, `UNITS_SPD_*`, `UNITS_RES_*`）

## 6. Great Talent

| スキルテキスト | DSLノード |
|---|---|
| grants Stat【Great Talent】+N (max +M) | `GRANTS_GREAT_TALENTS_PLUS_TO_TARGET_NODE(StatsNode.makeStatsNodeFrom(a,s,d,r), StatsNode.makeStatsNodeFrom(m,m,m,m))` |
| unit's Def Great Talent value | `UNITS_DEF_GREAT_TALENT_NODE` |

## 7. よく使う条件ノード

| スキルテキスト | DSLノード |
|---|---|
| if foe initiates combat | `FOE.check(INITIATED_COMBAT)` / `DOES_FOE_INITIATE_COMBAT_NODE` |
| if unit initiates combat | `DOES_UNIT_INITIATE_COMBAT_NODE` |
| if unit's Special triggered | `IS_TARGETS_SPECIAL_TRIGGERED_NODE` |
| if unit's HP >= 25% | `IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE` |
| if foe's attack can trigger foe's Special | `CAN_FOES_ATTACK_TRIGGER_FOES_SPECIAL_NODE` |
| if unit's Res >= foe's Res+N | `GTE_NODE(UNITS_EVAL_RES_DURING_COMBAT_NODE, ADD_NODE(FOES_EVAL_RES_DURING_COMBAT_NODE, N))` |

## 8. 奥義カウント操作

| スキルテキスト | DSLノード |
|---|---|
| inflicts Special cooldown count+N on foe before foe's first attack | `INFLICTS_SPECIAL_COOLDOWN_COUNT_PLUS_N_ON_TARGETS_FOE_BEFORE_TARGETS_FOES_FIRST_ATTACK_NODE(N)` |
| inflicts Special cooldown count+N on foe before foe's first follow-up attack | `INFLICTS_SPECIAL_COOLDOWN_COUNT_PLUS_N_ON_TARGETS_FOE_BEFORE_TARGETS_FOES_FIRST_FOLLOW_UP_ATTACK_NODE(N)` |
| inflicts Special cooldown count+N on foe before foe's second strike | `INFLICTS_SPECIAL_COOLDOWN_COUNT_PLUS_N_ON_TARGETS_FOE_BEFORE_TARGETS_FOES_SECOND_STRIKE_NODE(N)` |
| grants Special cooldown count-N before unit's first attack | `GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_X_BEFORE_UNITS_FIRST_ATTACK(N)` / `GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_N_TO_TARGET_BEFORE_TARGETS_FIRST_ATTACK_DURING_COMBAT_NODE(N)` |

※ ステータス確定後の条件（Res比較等）と組み合わせる場合は `APPLY_SKILL_EFFECTS_AFTER_STATUS_FIXED_NODE(...)` で囲む

## 9. 複合パターン（1行のスキルテキストに複数ノードが必要なケース）

### reduces damage by 40% (twice per combat)

奥義軽減 + 発動回数拡張の2ノード組み合わせ：

```javascript
// reduces damage from foe's attacks by 40% (twice per combat)
REDUCES_DAMAGE_FROM_TARGETS_FOES_ATTACKS_BY_X_PERCENT_BY_SPECIAL_NODE(40),
ANY_TARGETS_REDUCE_DAMAGE_EFFECT_ONLY_ONCE_CAN_BE_TRIGGERED_UP_TO_N_TIMES_PER_COMBAT_NODE(2),
```

### 味方への効果

味方への戦闘中効果は `registerSkillsForAlliesDuringCombat` で登録する。自身にも適用する場合は `registerSkillsDuringCombat` との二重登録が必要：

```javascript
// Grants Atk/Spd+5 to unit and allies within 2 spaces during combat.
SkillEffectRegistrar.registerSkillsForAlliesDuringCombat(skillId, cond,
    GRANTS_BONUS(ATK_SPD(5)).to(UNIT),
);
SkillEffectRegistrar.registerSkillsDuringCombat(skillId, cond,
    GRANTS_BONUS(ATK_SPD(5)).to(UNIT),
);
```

### 1回限りダメージ軽減（once per combat）

`AT_APPLYING_ONCE_PER_COMBAT_DAMAGE_REDUCTION_HOOKS` への登録が必要：

```javascript
// reduces damage from foe's next attack by 30% (once per combat)
AT_APPLYING_ONCE_PER_COMBAT_DAMAGE_REDUCTION_HOOKS.addSkill(skillId, () =>
    REDUCES_DAMAGE_FROM_TARGETS_FOES_NEXT_ATTACK_BY_N_PERCENT_ONCE_PER_COMBAT_NODE(30),
);
```

### ステータス条件付き奥義カウント加算（foe's first attack + follow-up）

ステータス比較と奥義トリガー可能判定の組み合わせ。`APPLY_SKILL_EFFECTS_AFTER_STATUS_FIXED_NODE` で囲む必要がある：

```javascript
// if unit's Res ≥ foe's Res+5 and foe's attack can trigger foe's Special,
// inflicts Special cooldown count+1 on foe before foe's first attack and
// before foe's first follow-up attack during combat
APPLY_SKILL_EFFECTS_AFTER_STATUS_FIXED_NODE(
    IF_NODE(AND_NODE(
            GTE_NODE(UNITS_EVAL_RES_DURING_COMBAT_NODE, ADD_NODE(FOES_EVAL_RES_DURING_COMBAT_NODE, 5)),
            CAN_FOES_ATTACK_TRIGGER_FOES_SPECIAL_NODE),
        INFLICTS_SPECIAL_COOLDOWN_COUNT_PLUS_N_ON_TARGETS_FOE_BEFORE_TARGETS_FOES_FIRST_ATTACK_NODE(1),
        INFLICTS_SPECIAL_COOLDOWN_COUNT_PLUS_N_ON_TARGETS_FOE_BEFORE_TARGETS_FOES_FIRST_FOLLOW_UP_ATTACK_NODE(1),
    ),
),
```

## 10. Style関連

### Hooks

| スキルテキスト / 用途 | Hook / ノード |
|---|---|
| Style発動条件 | `CAN_ACTIVATE_STYLE_HOOKS` |
| 移動可能Style射程（foes N spaces away） | `CAN_ATTACK_FOES_N_SPACES_AWAY_DURING_STYLE_HOOKS` → `CONSTANT_NUMBER_NODE(N)` |
| 移動不可Style攻撃範囲 | `CANNOT_MOVE_STYLE_ATTACK_RANGE_HOOKS` → `SPACES_OF_TARGET_NODE(...)` |
| 反撃条件 | `SUFFERS_COUNTERATTACK_DURING_STYLE_HOOKS` → `OR_NODE(...)` |
| Style発動後処理（CD等） | `STYLE_ACTIVATED_HOOKS` |
| Bulwark制限（2マス） | `CANNOT_UNIT_MOVE_THROUGH_SPACES_WITHIN_2_SPACES_OF_FOE_HOOKS` |
| Bulwark制限（3マス） | `CANNOT_UNIT_MOVE_THROUGH_SPACES_WITHIN_3_SPACES_OF_FOE_HOOKS` |

### ヘルパー関数

| 関数 | 用途 |
|---|---|
| `setUnitCanUseFollowingStyle(skillId, styleType)` | 武器→Style紐付け |
| `getStyleSkillId(style)` | `"style_N"` 仮想ID生成 |
| `setOnceUsedThisStyleCannotBeUsedForNTurns(skillId, n)` | Nターンクールダウン |

### 設定用Set

| Set | 用途 |
|---|---|
| `CANNOT_MOVE_STYLES` | 移動不可Style |
| `CANNOT_ATTACK_STRUCTURE_STYLES` | 構造物攻撃不可 |
| `STYLES_THAT_REMAINING_MOVEMENT_FROM_CANTO_IS_TREATED_AS_0` | Canto残移動量0 |
| `STYLES_THAT_CAN_BE_USED_ONLY_ONCE_PER_TURN` | 1ターン1回制限 |
| `STYLES_THAT_SKILLS_EFFECTS_RANGE_IS_TREATED_AS_1` | スキル効果射程1扱い |
| `STYLES_THAT_SKILLS_EFFECTS_RANGE_IS_TREATED_AS_2` | スキル効果射程2扱い |

### 条件ノード

| ノード | 用途 |
|---|---|
| `IS_STYLE_ACTIVE(style)` | Style有効判定（戦闘中効果の条件） |
| `IS_FOE_ARMOR_NODE` | 敵がアーマーか |
| `FOES_RANGE_IS_1_NODE` / `FOES_RANGE_IS_2_NODE` | 敵の射程判定 |
| `CAN_FOE_COUNTERATTACK_REGARDLESS_OF_RANGE_NODE` | 射程無視反撃判定 |
| `TARGET_HAS_TRIGGERED_THE_BULWARK_EFFECT_NODE` | Bulwark発動済み判定 |

## How to Update This Index

このインデックスは手動メンテナンスが必要です。以下の手順で更新してください。

### いつ更新するか
- 新しいDSLノードやHookを `SkillEffect.js` / `SkillEffectBattleContext.js` / `SkillEffectAliases.js` / `SkillEffectHooks.js` に追加したとき
- スキル実装中に「このパターンはインデックスにあれば迷わなかった」と気づいたとき

### 更新手順
1. 対応するセクション（ダメージ軽減、条件ノード等）のテーブルに行を追加
2. スキルテキスト（英語）とDSLノード名を対にして記載
3. 複数ノードの組み合わせが必要な場合はセクション9（複合パターン）に追加
4. 定義元ファイルのパスは不要（ノード名でgrepすれば見つかるため）

### 新規ノード追加時のチェックリスト
- [ ] ノードの用途に合うセクションに追記した
- [ ] 既存の類似ノードとの違いが分かるよう記載した
- [ ] 複合パターンが必要な場合はセクション8にも追記した
