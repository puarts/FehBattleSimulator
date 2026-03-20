# Code Review: Section 04 - Stage C データ構造の ESM 化

1. **CRITICAL: Implicit globals not fixed (Skill.js lines 2081, 2083)** -- `applySkillEffectsAfterAfterBeginningOfCombatFuncMap` and `applySkillEffectsAfterAfterBeginningOfCombatFromAlliesFuncMap` are declared without `const`. They are also NOT in the export list. Other files reference these maps.

2. **MEDIUM: StatusEffectType re-exported from Skill.js** -- StatusEffectType is defined in Skill.js (not SkillConstants.js). No actual conflict but dual-source risk for future.

3. **MEDIUM: Multiple export lines vs single export line** -- Plan says single line but implementation uses ~30 separate export statements. Build filter handles all correctly.

4. **LOW: TurnSetting.js import deviates from plan (correctly)** -- Plan included ValueDelimiter but it's not used. Implementation correctly omits it.

5. **LOW: No systematic completeness verification** -- Some symbols may be missing from exports.

6. **LOW: g_siteRootPath usage** -- Imported in Skill.js; actually used at line 1642.
