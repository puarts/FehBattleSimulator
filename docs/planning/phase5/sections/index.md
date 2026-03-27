<!-- PROJECT_CONFIG
runtime: typescript-npm
test_command: npm run test:only
END_PROJECT_CONFIG -->

<!-- SECTION_MANIFEST
section-01-filter-evacuation
section-02-concatenation-removal
section-03-damagecalculator-esm
section-04-skilleffect-esm
section-05-verification
END_MANIFEST -->

# Section 12: Implementation Sections Index

## Dependency Graph

| Section | Depends On | Blocks | Parallelizable |
|---------|------------|--------|----------------|
| section-01-filter-evacuation | - | section-02-concatenation-removal | No |
| section-02-concatenation-removal | section-01-filter-evacuation | section-05-verification | Yes |
| section-03-damagecalculator-esm | - | section-05-verification | Yes |
| section-04-skilleffect-esm | - | section-05-verification | Yes |
| section-05-verification | section-02, section-03, section-04 | - | No |

## Execution Order

1. section-01-filter-evacuation (no dependencies)
2. section-02-concatenation-removal, section-03-damagecalculator-esm, section-04-skilleffect-esm (parallel after section-01)
3. section-05-verification (after all above)

**注意:** section-02/03/04 は実装は並列可能だが、vitest.setup.js を削除した瞬間に DamageCalculator.test.js / SkillEffect.test.js が壊れるため、**適用（コミット）は同一変更セットとして行う**こと。

## Section Summaries

### section-01-filter-evacuation
vitest.setup.js の責務監査と filterImportExport() 関数の Tests/legacy/ への退避。

### section-02-concatenation-removal
vitest.setup.js の削除と vite.config.js から setupFiles の除去。

### section-03-damagecalculator-esm
DamageCalculator.test.js の完全ESM化。TestGlobals.js からの named import、TestUtilities.js からの import 追加、HeroBattleTest の動作確認。

### section-04-skilleffect-esm
SkillEffect.test.js の未移行参照の解消。g_testHeroDatabase、test_DamageCalculator、globalThis.g_appData 等の ESM import 化。

### section-05-verification
全変更適用後の段階的検証。DamageCalculator.test.js 単体 → 関連テスト → 全体テスト → WARN: Non-TDZ ReferenceError 確認 → vm.runInThisContext grep 確認。
