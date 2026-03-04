---
name: implement-skills
description: FEHスキルの実装。SkillImplファイルへのスキル追加、DSLノードの使用、未実装スキルの実装時に自動で読み込む。
---

# Skills実装ガイド

## 基本方針

- 新スキルは最新の日付ファイル（現在は `SkillImpl202601.js`）に追加する
- 参考にするスキルは最新のものを優先し、DSLベースの実装のみ参照する
- 不可能・不明・自信がないものはTODOコメントを残して実装しない（特にどのHooksか不明な場合）
- **TODOでスキップする場合でも、元のスキルテキスト（英語）をコメントとして必ず残す。削除しない**
- フォーマット: スキルテキストのコメント → プログラムコード

## Node `.to()` Compatibility

`UNIT.doEffects()` 内のノードは `.to(target)` が呼ばれる。`.to()` 非対応ノードは `doEffects()` の外に出す。

### `.to()` 対応（`doEffects()` 内で使用可能）

- `DEALS_DAMAGE(n)`, `REDUCES_DAMAGE_FROM_FOES_ATTACKS_BY(n)`, `REDUCES_DAMAGE_FROM_FOES_SPECIALS_BY(n)` — CallBattleContextFuncNode系
- `GRANTS_BONUS(...)`, `INFLICTS_PENALTY(...)` — SingleEffectNode系
- `NEUTRALIZES_EFFECTS_THAT_INFLICT_SPECIAL_COOLDOWN_CHARGE_MINUS_X.on(unitNode)`
- `GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_X_BEFORE_UNITS_FIRST_ATTACK(n)`, `REDUCES_PERCENTAGE_OF_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_N_PERCENT(n)` — MOD_BATTLE_CONTEXT_FIELD系

### `.to()` 非対応（`registerSkillsDuringCombat` の直接引数 or `AT_START_OF_COMBAT_HOOKS.addSkill()` で使用）

- `NEUTRALIZES_EFFECTS_THAT_PREVENT_TARGETS_COUNTERATTACKS_DURING_COMBAT_NODE`
- `TARGET_CAN_MAKE_FOLLOW_UP_ATTACK_BEFORE_FOES_NEXT_ATTACK_NODE`
- `UNIT_DISABLES_SKILLS_THAT_CHANGE_ATTACK_PRIORITY`
- `REDUCES_DAMAGE_FROM_TARGETS_FOES_ATTACKS_BY_X_PERCENT_DURING_COMBAT_NODE(n)` — GetUnitMixin
- `WHEN_TARGET_DEALS_DAMAGE_DURING_COMBAT_RESTORES_N_HP_TO_TARGET_NODE(n)` — FromPositiveNumberNode
- `GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_N_TO_TARGET_BEFORE_TARGETS_FOES_FIRST_ATTACK_DURING_COMBAT_NODE(n)`
- `DEALS_DAMAGE_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS(n, statNode)`
- `REDUCES_DAMAGE_FROM_TARGETS_FOES_ATTACKS_BY_PERCENTAGE_OF_TARGETS_STAT_EXCLUDING_AOE_SPECIALS_NODE(n, statNode)`
- `NEUTRALIZES_FOES_BONUSES_TO_STATS_DURING_COMBAT_NODE`

### 定数ノード（共有インスタンス）

`NEUTRALIZES_EFFECTS_THAT_GRANT_SPECIAL_COOLDOWN_CHARGE_PLUS_X` 等の定数ノードを `makeArray` 等で `registerSkillsDuringCombat` に直接渡す場合は `.to(unitNode)` を明示的に呼ぶ。`doEffects()` 内では自動で呼ばれるため不要。

## 専用フックが必要なスキル種別（TODO対象）

以下は標準DSLでは実装不可。TODOとして残す:
- 比翼/デュオスキル — `WHEN_TRIGGERS_DUO_OR_HARMONIZED_EFFECT_HOOKS`
- Styleシステム — `setUnitCanUseFollowingStyle` 系
- 複雑な奥義（Frozen Mirror, Armored Flare, Goddess Dance）
- エンゲージ関連（Emblem Effect）
- Guardian+（Rally Assist + heal + 状態付与の複合）
