# Code Review: Section 03 - Stage B 定数・列挙型の ESM 化

The implementation is structurally sound and correctly applies import/export statements to the three target files. However, there are several issues ranging from a concrete missing export to undocumented cross-stage dependency risks.

**HIGH: Missing export of `__getStatusRankValue` in HeroInfoConstants.js**
The function `__getStatusRankValue` is defined at line 211 of HeroInfoConstants.js and is referenced externally in `Sources/HeroInfo.js` (lines 598-599). It is NOT included in any export statement in the diff. While this does not break the concatenated build (Phase 2), it WILL break in Phase 3 when native ESM is used. The plan also failed to list this symbol -- both the plan and implementation missed it. This is the most critical finding.

**MEDIUM: Undocumented cross-stage dependency in UnitConstants.js**
UnitConstants.js references `StatusEffectType` (defined in `Sources/Skill.js` at line 1268) and `POSITIVE_STATUS_EFFECT_ORDER_MAP` / `NEGATIVE_STATUS_EFFECT_ORDER_MAP` (defined in `Sources/Skill.js` at lines 1540, 1577). These symbols are NOT imported because Skill.js belongs to a later stage. This is acceptable for Phase 2 concatenated mode, but creates a forward-dependency that will require resolution in Phase 3 (likely by extracting these definitions into an earlier-stage file or restructuring). Neither the plan nor the implementation documents this risk, which will surprise the implementer of later stages.

**LOW: Plan over-specified SkillConstants.js imports**
The plan (line 94) listed `g_siteRootPath`, `g_heroIconRootPath`, `g_debugImageRootPath` as symbols to import in SkillConstants.js. The implementation correctly omitted these -- grep confirms zero references to these symbols in SkillConstants.js. The implementation is more accurate than the plan here.

**LOW: Implementation improves on plan by exporting `calcAppliedGrowthRate_Optimized`**
The plan's export list for HeroInfoConstants (line 160) omitted `calcAppliedGrowthRate_Optimized`, but the implementation correctly includes it (diff line 18). This function is defined at line 183 of HeroInfoConstants.js and is called at line 194. While it appears to only be used internally, exporting it is the safer choice for completeness.

**OBSERVATION: No verification that export lists are exhaustive**
The plan (lines 224-232) emphasizes the importance of exhaustive export identification via project-wide grep. However, the `__getStatusRankValue` miss demonstrates this was not fully done. A systematic audit of all top-level declarations against the export lists would be advisable before merging.
