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

## Hero enum の heroId の調べ方

`Hero` enum の値は `heroId`（`HeroInfo.id`）を使用する。新しい英雄を追加する際は、`SampleHeroInfos.js` から heroId を取得する。

```bash
# 英雄名で検索し、idフィールドを確認する
grep -n '英雄名' Sources/SampleHeroInfos.js
```

各行は `new HeroInfo(...)` で、id は `], <id>, true/false` のパターンで見つかる。例:

```
new HeroInfo('双界ヘクトル', ..., [], 1395, false, ...)
                                       ^^^^
                                       これが heroId
```

## 比翼/デュオスキル（Duo or Harmonized Skill）

Hero ID が未定義でも、`Hero.xxx` プレースホルダーのまま**スキル内容だけ先に実装する**。

```javascript
{
    // 比翼○○ or デュオ○○
    const skillId = getDuoOrHarmonizedSkillId(Hero.xxx);
    WHEN_TRIGGERS_DUO_OR_HARMONIZED_EFFECT_HOOKS.addSkill(skillId, NODE_FUNC(
        // ... スキル効果のDSLノード
    ));
}
```

### 再行動パターン（Resonance系共通）

同出典の行動済み味方が1体ならその味方に、0体ならユニット自身に再行動+Canto再有効化を付与する。参照: `SkillImpl202501.js` の Harmonized Ike。

```javascript
let alliesNode =
    CACHE_NODE(`${skillId}_同じ出典の最もHPが高い行動済みの味方`,
        MAX_UNITS_NODE(
            FILTER_UNITS_NODE(SKILL_OWNERS_ALLIES_ON_MAP_NODE,
                AND_NODE(
                    ARE_TARGET_AND_SKILL_OWNERS_HAS_SAME_TITLE_NODE,
                    IS_TARGET_ACTION_DONE_NODE,
                ),
            ),
            TARGETS_HP_ON_MAP_NODE,
        ),
    );
// 0体 → ユニット自身に付与
IF_NODE(EQ_NODE(COUNT_UNITS_NODE(alliesNode), 0),
    FOR_SKILL_OWNER_NODE(GRANTS_ANOTHER_ACTION_TO_TARGET_ON_MAP_NODE),
    FOR_SKILL_OWNER_NODE(RE_ENABLES_CANTO_TO_TARGET_ON_MAP_NODE),
),
// 1体 → その味方に付与
IF_NODE(EQ_NODE(COUNT_UNITS_NODE(alliesNode), 1),
    FOR_EACH_UNIT_NODE(alliesNode,
        GRANTS_ANOTHER_ACTION_TO_TARGET_ON_MAP_NODE,
        RE_ENABLES_CANTO_TO_TARGET_ON_MAP_NODE,
    ),
),
```

### Resonance ステータス付与

- `ResonantShield` → `GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.ResonantShield)`
- `ResonantBlades` → `GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE(StatusEffectType.ResonantBlades)`
- 同出典の味方全員に付与: `FOR_EACH_UNIT_FROM_SAME_TITLES_NODE(...)` で囲む

## StatusEffectType の使用ルール

- `StatusEffectType` の定数名は非常に長く、省略名は存在しない。**必ず `Skill.js` の定義を確認してから使用する**
- 定義が見つからない場合はユーザーに確認する（推測で省略名を使わない）
- 例: `NeutralizesFoesBonuses` ではなく `NeutralizesFoesBonusesDuringCombat`、`SpecialCooldownChargePlus1PerAttack` ではなく `SpecialCooldownChargePlusOnePerAttack`

## 専用フックが必要なスキル種別（TODO対象）

以下は標準DSLでは実装不可。TODOとして残す:
- Styleシステム — `setUnitCanUseFollowingStyle` 系
- 複雑な奥義（Frozen Mirror, Armored Flare, Goddess Dance）
- エンゲージ関連（Emblem Effect）
- Guardian+（Rally Assist + heal + 状態付与の複合）
