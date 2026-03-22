# Layer Violation Status — Phase 4 (Layer Violations)

## Summary

- **Total violations identified (Section 01)**: 7件
- **Resolved**: 7件
- **Remaining (deferred)**: 6件（新規発見、このフェーズのスコープ外。D1-D6参照）

## Resolved Violations

### Section 02: StatusIndex Unification
| # | File (Layer) | Symbol | Source (Layer) | Status |
|---|-------------|--------|----------------|--------|
| 1 | SkillEffect.js (L5) | ATK, SPD, DEF, RES aliases | StatusConstants.js (L1) | Resolved — エイリアス削除、StatusIndex.X に統一 |

### Section 03: GameMode Relocation
| # | File (Layer) | Symbol | Source (Layer) | Status |
|---|-------------|--------|----------------|--------|
| 2 | 8 consumer files (L7-L8) | GameMode | DamageCalculator.js (L4) | Resolved — StatusConstants.js (L1) に移動 |
| 3 | BattleMap.js (L3) | GameMode | グローバル参照 | Resolved — StatusConstants.js からimport追加 |
| 4 | SkillEffect.js (L5) | GameMode | グローバル参照 | Resolved — StatusConstants.js からimport追加 |
| 5 | SkillImpl.js (L6) | GameMode | グローバル参照 | Resolved — StatusConstants.js からimport追加 |

### Section 04: moveStructureToTrashBox Separation
| # | File (Layer) | Symbol | Source (Layer) | Status |
|---|-------------|--------|----------------|--------|
| 6 | SkillEffect.js (L5) | moveStructureToTrashBox | BattleSimulatorBase.js (L7) | Resolved — コールバック登録パターンに変更 |
| 7 | Main_MouseAndTouch.js (L8) | moveUnit等 | BattleSimulatorBase.js (L7) | Resolved — ESM import追加 |

## Deferred Violations (Scope Outside This Phase)

### DamageCalculator.js (L4) → Layer 5 Dependencies

| # | File (Layer) | Import | Source (Layer) | Notes |
|---|-------------|--------|----------------|-------|
| D1 | DamageCalculator.js (L4) | getSkillLogLevel | SkillEffect.js (L5) | 戦闘ログレベル取得。移動先要検討 |
| D2 | DamageCalculator.js (L4) | AFTER_ATTACK_HOOKS 等 | SkillEffectHooks.js (L5) | フック定義。L3-4共有モジュールへの移動が妥当 |
| D3 | DamageCalculator.js (L4) | NodeEnv | SkillEffectEnv.js (L5) | JSDoc型参照のみ。SkillEffectEnv.jsは実質L3-4レベル |
| D3b | DamageCalculatorWrapper.js (L4) | NodeEnv等 | SkillEffect.js, SkillEffectEnv.js, SkillEffectHooks.js (L5) | DamageCalculator.jsと同様のL4→L5依存 |

### Vue Global Property Dependencies

| # | File | Symbol | Injection Source | Notes |
|---|------|--------|-----------------|-------|
| D4 | VueComponents.js | GameMode | BattleSimulatorBase.js (app.config.globalProperties) | Vue template内で使用、ESM importではない |
| D5 | HTML templates (4 files) | GameMode | 同上 | ArenaSimulator.html, SummonerDuelsSimulator.html, UnitBuilder.html, AetherRaidSimulator.html |

### Circular Dependency Risk

| # | File (Layer) | Dependency | Notes |
|---|-------------|-----------|-------|
| D6 | Main_OriginalAi.js (L7) | moveStructureToTrashBox 等をグローバル使用 | BattleSimulatorBase.js ↔ Main_OriginalAi.js の相互参照のためimport追加不可 |

## Validation Results

- `npm test`: 全テスト通過（DamageCalculator_HeroBattleTest のtimeoutを除く、2026-03-22時点）
- `npx madge --circular Sources/`: 0 circular dependencies
- `Tests/FinalValidation.test.js`: 10/10 pass
- `Tests/StatusConstants.test.js`: 既存テスト全通過（re-export互換性維持）
- `Tests/GameModeRelocation.test.js`: 3/3 pass
- `Tests/MoveUnitSeparation.test.js`: 2/2 pass
