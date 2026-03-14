---
name: implement-skills
description: FEHスキルの実装。SkillImplファイルへのスキル追加、DSLノードの使用、未実装スキルの実装時に自動で読み込む。
---

# Skills実装ガイド

## Step 0: DSLリファレンスの読み込み（必須）

**実装を始める前に、必ず `Sources/SkillDslReference.md` を Read ツールで読み込むこと。**

これにより以下を把握する：
- 利用可能なHookとタイミング
- ダメージ軽減ノードの種類（最も混同しやすい — 7種類以上ある）
- 奥義カウント操作ノード
- 条件ノード（`CAN_FOES_ATTACK_TRIGGER_FOES_SPECIAL_NODE` 等）
- 複合パターン（複数ノードの組み合わせが必要なケース）

リファレンスを読まずにTODO化するのは禁止。「ノードが存在しないかもしれない」と思ったら、リファレンス → grep の順で二重確認する。

## 基本方針

- 新スキルは最新の日付ファイル（現在は `SkillImpl202601.js`）に追加する
- 参考にするスキルは最新のものを優先し、DSLベースの実装のみ参照する
- 不可能・不明・自信がないものはTODOコメントを残して実装しない（特にどのHooksか不明な場合）
- **TODOでスキップする場合でも、元のスキルテキスト（英語）をコメントとして必ず残す。削除しない**
- フォーマット: スキルテキストのコメント → プログラムコード

## 奥義（Special）の実装

### setSpecialCountAndType の引数

```javascript
setSpecialCountAndType(skillId, n, isInheritable, isNormalAttack, isDefense, isGaleforce)
```

### fehdb からの取得（n, isInheritable）

```bash
# 1. fehdbを取得（未クローンの場合）
git clone --depth 1 https://github.com/puarts/fehdb.git /tmp/fehdb
# ネットワーク不可の場合は ../fehdb を参照
FEHDB_PATH="${FEHDB_PATH:-/tmp/fehdb}"
[ ! -d "$FEHDB_PATH" ] && FEHDB_PATH="../fehdb"

# 2. 奥義名で検索
sqlite3 "$FEHDB_PATH/feh-skills.sqlite3" \
  "SELECT english_name, inherit, count FROM skills WHERE type = '奥義' AND english_name = '奥義英語名'"
```

- `count` → 第2引数 `n`（奥義カウント数）
- `inherit` → 第3引数 `isInheritable`（`'可'` → `true`, `'不可'` → `false`）

### スキルテキストからの判定（isNormalAttack, isDefense, isGaleforce）

fehdb に攻撃/防御の分類カラムはないため、スキルテキスト（fehdbの `description`）から判定する:

| 分類 | テキストパターン | フラグ |
|---|---|---|
| 攻撃奥義 | `奥義ダメージに加算` を含む | `isNormalAttack=true` |
| 防御奥義 | ダメージ軽減のみで `奥義ダメージに加算` を含まない（Pavise, Miracle等） | `isDefense=true, isNormalAttack=false` |
| 疾風迅雷系 | `行動可能にする` が主効果 | `isGaleforce=true, isNormalAttack=false` |
| ハイブリッド | `奥義ダメージに加算` + `軽減` 両方（最近の奥義の大半） | `isNormalAttack=true, isDefense=false` |

**注意**: 最近の奥義はほぼ全てハイブリッド（攻撃+軽減）だが、コード上は `isNormalAttack=true, isDefense=false` で統一。純粋な防御奥義（Life Unending等）のみ `isDefense=true`。

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

## Style実装

**トリガー**: コメントに `Unit can use the following【Style】: XXX Style` がある場合

### Step 1: StyleType 登録（SkillConstants.js）

1. `Sources/SkillConstants.js` の `StyleType` オブジェクトを読む
2. 最大値を確認し、+1 した番号で新しいキーを追加
   - スタイル名 → UPPER_SNAKE_CASE（例: `Scendscale Style` → `SCENDSCALE: 12`）
3. `STYLE_TYPE_NAMES` 配列に日本語名を追加
   - 配列のインデックスと StyleType の値が一致する必要がある
   - 欠けているインデックスは空文字 `''` で埋める
   - 日本語名は以下の手順で **fehdb から取得する**（推測しない）

**日本語名の取得手順（fehdb）**:

```bash
# 1. fehdbを取得（未クローンの場合）
git clone --depth 1 https://github.com/puarts/fehdb.git /tmp/fehdb
# ネットワーク不可の場合は ../fehdb を参照
FEHDB_PATH="${FEHDB_PATH:-/tmp/fehdb}"
[ ! -d "$FEHDB_PATH" ] && FEHDB_PATH="../fehdb"

# 2. スキルDBから武器の説明文を検索し、【スタイル】:XXX の日本語名を取得
sqlite3 "$FEHDB_PATH/feh-skills.sqlite3" \
  "SELECT description FROM skills WHERE english_name = '武器英語名'" \
  | grep -o '【スタイル】:[^<]*' | sed 's/【スタイル】://'
```

スタイル名は武器スキルの `description` 内の `【スタイル】:日本語名` に記載されている。
武器自体にスタイル記載がない場合は、その武器の英語名で `description` を全文検索する:

```bash
sqlite3 "$FEHDB_PATH/feh-skills.sqlite3" \
  "SELECT description FROM skills WHERE description LIKE '%スタイル%' AND description LIKE '%武器日本語名%'"
```

### Step 2: 武器ブロックでの紐付け

TODOコメントを以下に置換:
```javascript
setUnitCanUseFollowingStyle(skillId, StyleType.XXX);
```

### Step 3: Style効果ブロックの実装

武器ブロックの後に新しいブロックスコープで実装。2種類のパターンがある。

**パターン判定**:
- スキルテキストに「Unit cannot move」がある → **CANNOT_MOVE型**
- スキルテキストに「Unit can attack foes N spaces away」がある → **移動可能型**

**移動可能型テンプレート**（参考: Sublime Heaven — SkillImpl202501.js:8574-8627）:
```javascript
{
    const style = StyleType.XXX;
    const skillId = getStyleSkillId(style);
    CAN_ACTIVATE_STYLE_HOOKS.addSkill(skillId, () => TRUE_NODE);
    // Unit can attack foes N spaces away (unit cannot attack adjacent foes).
    CAN_ATTACK_FOES_N_SPACES_AWAY_DURING_STYLE_HOOKS.addSkill(skillId, () =>
        CONSTANT_NUMBER_NODE(N));
    // 戦闘中効果（あれば）
    SkillEffectRegistrar.registerSkillsDuringCombat(skillId, IS_STYLE_ACTIVE(style),
        ...effects,
    );
    // Cannot move through spaces within N spaces of foe that has triggered the Bulwark effect
    CANNOT_UNIT_MOVE_THROUGH_SPACES_WITHIN_N_SPACES_OF_FOE_HOOKS.addSkill(skillId, () =>
        AND_NODE(
            IS_STYLE_ACTIVE(style),
            FOR_TARGET_NODE(TARGETS_FOE_NODE, TARGET_HAS_TRIGGERED_THE_BULWARK_EFFECT_NODE),
        ));
    // Unit suffers a counterattack if...
    SUFFERS_COUNTERATTACK_DURING_STYLE_HOOKS.addSkill(skillId, () =>
        OR_NODE(...conditions));
    // After-combat movement effects do not occur.
    AT_START_OF_COMBAT_HOOKS.addSkill(skillId, NODE_FUNC(
        IF_NODE(IS_STYLE_ACTIVE(style),
            AFTER_COMBAT_MOVEMENT_EFFECTS_DO_NOT_OCCUR_BECAUSE_OF_TARGET_NODE,
        )));
    // Skill effect's Range is treated as 1 or 2.
    STYLES_THAT_SKILLS_EFFECTS_RANGE_IS_TREATED_AS_1.add(style); // or _AS_2
    // 使用制限（どちらか一方）
    STYLES_THAT_CAN_BE_USED_ONLY_ONCE_PER_TURN.add(style);
    // or: setOnceUsedThisStyleCannotBeUsedForNTurns(skillId, N);
}
```

**CANNOT_MOVE型テンプレート**（参考: Freeze — SkillImpl202601.js:768-840）:
```javascript
{
    const style = StyleType.XXX;
    const skillId = getStyleSkillId(style);
    CAN_ACTIVATE_STYLE_HOOKS.addSkill(skillId, () => TRUE_NODE);
    CANNOT_MOVE_STYLE_ATTACK_RANGE_HOOKS.addSkill(skillId, () =>
        SPACES_OF_TARGET_NODE(AND_NODE(
            IS_SPACE_WITHIN_N_SPACES_OF_TARGET_NODE(N),
            IS_SPACE_WITHIN_N_ROWS_OR_M_COLUMNS_CENTERED_ON_TARGET_NODE(R, C))));
    // 戦闘中効果
    SkillEffectRegistrar.registerSkillsDuringCombat(skillId, IS_STYLE_ACTIVE(style), ...effects);
    CANNOT_MOVE_STYLES.add(style);
    CANNOT_ATTACK_STRUCTURE_STYLES.add(style);
    // ...反撃条件、射程扱い、使用制限は移動可能型と同じ
}
```

**Bulwarkフックの選択**:
- 「within 2 spaces」 → `CANNOT_UNIT_MOVE_THROUGH_SPACES_WITHIN_2_SPACES_OF_FOE_HOOKS`
- 「within 3 spaces」 → `CANNOT_UNIT_MOVE_THROUGH_SPACES_WITHIN_3_SPACES_OF_FOE_HOOKS`

**反撃条件の頻出パターン**:
- `AND_NODE(IS_FOE_ARMOR_NODE, FOES_RANGE_IS_1_NODE)` — foe is armored with Range = 1
- `AND_NODE(IS_FOE_ARMOR_NODE, FOES_RANGE_IS_2_NODE)` — foe is armored with Range = 2
- `CAN_FOE_COUNTERATTACK_REGARDLESS_OF_RANGE_NODE` — foe can counterattack regardless of unit's range
- `EQ_NODE(FOES_RANGE_NODE, DISTANCE_BETWEEN_TARGET_AND_TARGETS_FOE_NODE)` — foe's Range is the same as the distance

**Canto残移動量0について**: `STYLES_THAT_REMAINING_MOVEMENT_FROM_CANTO_IS_TREATED_AS_0.add(style)` で登録する。

## 専用フックが必要なスキル種別（TODO対象）

以下は標準DSLでは実装不可。TODOとして残す:
- 複雑な奥義（Frozen Mirror, Goddess Dance）
- エンゲージ関連（Emblem Effect）
