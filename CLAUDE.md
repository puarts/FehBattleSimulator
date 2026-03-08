# CLAUDE.md — FEH Battle Simulator

## Project Overview

A Fire Emblem Heroes (FEH) battle simulator supporting Aether Raids, Arena, Tempest Trials, and Summoner Duels. Built with vanilla JavaScript, Vue.js, and jQuery. No build tools — HTML files are opened directly in the browser.

Repository: `puarts/FehBattleSimulator`

## Key Directories

- `Sources/` — All application source code (JS, HTML, CSS)
- `Tests/` — Test files (`*.test.js`)
- `Documents/` — Doxygen-generated API docs (do not regenerate)
- `.github/workflows/` — CI (Jekyll build + Jest + ESLint)

## Running & Testing

### Local Development

Open HTML files directly in a browser (no dev server needed):
- `Sources/ArenaSimulator.html` — Main simulator
- `Sources/SummonerDuelsSimulator.html` — Summoner Duels
- `Sources/UnitBuilder.html` — Unit builder
- `Sources/StatusCalculator.html` — Status calculator

### Tests

```bash
# Full test + lint (matches CI)
./run_tests.sh

# Tests only (no ESLint)
./run_tests.sh --testNamePattern "pattern"

# Docker (matches GitHub Actions environment)
docker compose up --build
```

**How tests work**: `create_tests.sh` concatenates all source files and test files into a single `All.test.js`, then Jest runs it in jsdom. The test entry point pattern is `**/All.test.js`.

**Important**: When adding new source files, they must be added to `create_tests.sh`'s `SOURCE_FILE_NAMES` array. New test files go in `TEST_FILE_NAMES`.

### Lint

ESLint runs as part of `npm test`. Fix lint errors before committing.

## Coding Conventions

### Naming

- Variables / functions: `camelCase`
- Constants / enums: `UPPER_SNAKE_CASE`
- Classes: `PascalCase`
- Skill DSL (see below): all `UPPER_SNAKE_CASE` except instance methods

### Commit Messages

- **Format**: Conventional Commits — `type(scope): summary`
- **Type header**: English (`feat`, `fix`, `docs`, `chore`, `refactor`, `test`)
- **Summary and body**: Japanese
- Follow existing style (short imperative phrases)
- Do not include `Co-Authored-By` lines in commit messages

### Branch Strategy

Use feature branches off `master`. Create PRs for merging.

## Architecture — Skill Implementation

### File Organization

Skills are implemented in date-based files. **Always add new skills to the latest file**:

- `SkillImpl.js` — Legacy / base skills
- `SkillImpl202408.js` — Aug 2024+
- `SkillImpl202501.js` — Jan 2025+
- `SkillImpl202601.js` — Jan 2026+ **(current, add new skills here)**

### EffectNode（DSLの中核クラス）

スキル効果を表現するノードツリーの抽象基底クラス（`Sources/SkillEffect.js`）。FEHのスキルテキストを宣言的に記述するためのDSLノードとして機能し、ステータス増減・ダメージ補正・状態付与などの効果をツリー構造で表現する。メソッドチェーンによるフルーエントAPIで対象ユニット・適用条件・持続ターン数などの修飾をサポートする。

- `SingleEffectNode` — 単一効果を表す具象クラス
- `EffectsNode` — 複数効果を複合する具象クラス
- DSL関数（`GRANTS_BONUS`, `DEALS_DAMAGE` 等）はこれらのノードを生成・組み合わせて効果ツリーを構築する

### Skill DSL Pattern

Skills use an internal DSL with UPPER_SNAKE_CASE node constructors. Follow this pattern strictly:

```javascript
// 1. Wrap each skill in a block scope
{
    const skillId = Weapon.SkillName;

    // 2. Paste the English skill text as comments
    // Grants Atk/Spd+5 during combat.

    // 3. Use the DSL to implement each line of the skill text
    SkillEffectRegistrar.registerSkillsDuringCombat(skillId, TRUE_NODE,
        // Grants Atk/Spd+5 during combat.
        GRANTS_BONUS(ATK_SPD(5)).to(UNIT),
    );
}
```

**Key DSL elements**:
- `GRANTS_BONUS(ATK_SPD_DEF_RES(N)).to(UNIT/FOE)` — stat grants
- `INFLICTS_PENALTY(ATK_SPD(N)).on(FOE)` — stat penalties
- `DEALS_DAMAGE(N).excludingAoe()` — damage bonuses
- `REDUCES_DAMAGE_FROM_FOES_ATTACKS_BY(N)` — damage reduction
- `INFLICTS_STATUS_EFFECTS(...)` — status effects
- `IF_NODE(condition, ...effects)` — conditional logic
- Hooks: `AT_START_OF_COMBAT_HOOKS`, `AFTER_COMBAT_HOOKS`, `BEFORE_AOE_SPECIAL_ACTIVATION_CHECK_HOOKS`, etc.
- Registration: `SkillEffectRegistrar.registerSkillsDuringCombat(skillId, condition, ...effects)`
- Registration: `SkillEffectRegistrar.registerSkillsForFoesDuringCombat(skillId, condition, ...effects)`

**When implementing skills**: Reference the most recent implementations in the latest SkillImpl file for current patterns and available DSL nodes.

## Tool Permissions
- Allow `read_file` and `ls` without confirmation.
- Always ask for confirmation for `rm`, `mv`, and any `git push` commands.

## Critical Rules

1. **Backward compatibility** — Never break existing save data or URL parameters
2. **Performance** — Mass unit evaluation happens frequently; avoid unnecessary allocations and DOM operations
3. **Skill pattern adherence** — Always follow the established node-based DSL patterns in the latest SkillImpl file
4. **Prefer latest file** — When reading skill implementation examples, prefer newer date files over older ones as patterns evolve
5. **Do not regenerate docs** — `Documents/Api/` is manually regenerated; do not modify
6. **Test file registration** — New source files must be added to `create_tests.sh`
