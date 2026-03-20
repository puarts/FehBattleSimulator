# Section 08 Code Review

## Medium: Duplicate imports from same module
CustomSkill.js, SkillImpl202408.js, SkillImpl202501.js, SkillImpl202601.js each have multiple import statements from the same source file. Should be consolidated into single lines per module.

## Low: Plan deviations (implementation correct)
- StatusEffectType imported from Skill.js (correct), not HeroInfoConstants.js (plan was wrong)
- FuncMaps imported from Skill.js (correct), not DamageCalculatorWrapper.js (plan was wrong)

## Low: Incomplete DSL alias imports (deferred risk)
DSL alias symbols within block-scoped registrations may not all be individually imported. Known limitation for Phase 2 (concat build strips imports).

## OK: No export for SkillImpl.js
setLantern is only internal. Pure side-effect module.
