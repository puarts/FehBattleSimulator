# Section 02 Code Review — 依存グラフ構築

## Auto-fixed Issues

### 1. HTML Deploy.bat parsing broken
- Deploy.bat has multiple `set copyfiles=` lines; regex matched the wrong one
- Fixed: now finds the assignment associated with `.html` copy section
- Result: 7 production + 1 local correctly classified

### 2. HTML script extraction missed loadScripts pattern
- HTML files use `additionalScripts = [...]` pattern, not `loadScripts([...])`
- Fixed: regex now matches variable assignments with JS file arrays
- Result: All HTML files show correct JS file counts

### 3. classifyLayers infinite loop risk
- Added `maxIterations` safety guard to fixed-point iteration

## Issues Discussed with User

### 4. Giant SCC (39 files) vs 3 separate cycle groups
- Tarjan SCC correctly produces 1 large component because the 3 known cycles (AppData<->BattleSimulatorBase, Unit<->BattleContext<->BattleMap, DamageCalculator<->PostCombatSkillHandler) are transitively connected
- This is accurate — the codebase truly has a 39-file interconnected cycle
- The plan expected 3 separate groups but reality shows they're all linked

## Let Go

- File naming (.js vs .mjs, Tools/tests/ vs Tests/) — consistent with section-01's existing CJS pattern
- Side-effect categories differ from plan's 5 (section-01 has finer-grained categories: global-constant, global-mutable-state) — more detailed is better
- No empty graph edge case tests — not a practical concern
