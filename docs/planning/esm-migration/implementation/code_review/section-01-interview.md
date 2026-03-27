# Code Review Interview: section-01-ast-analysis-tool

## Interview Decisions

### 1. global-assignment classification (Important #2)
**Decision:** Expanded to 3-way classification per user request
- `global-constant`: literal/constant-only initializers (strings, numbers, concatenation)
- `global-mutable-state`: let/var with null/false/""/0 placeholders
- `global-assignment`: runtime execution (new, function calls)
**Applied:** Yes — rewrote `classifyVariableDeclaration` with `isConstantExpression` and `isMutableStateInit` helpers

### 2. CI integration (Important #5)
**Decision:** Defer to later section
**Applied:** No change

### 3. global-symbols.json in git (Observation)
**Decision:** Add `Tools/output/` to `.gitignore`
**Applied:** Yes

## Auto-fixes Applied

### A. Remove unused acorn-walk import (Important #1)
Removed `const walk = require('acorn-walk')` from ast-extractor.js

### B. Share AST between functions (Important #4)
Added `parseCode()` export to ast-extractor.js. Both `extractSymbols` and `classifySideEffects` now accept optional pre-parsed AST. CLI entry point parses once.

### C. Add popScope guard (Minor #7)
Added bounds check to `popScope()` that throws on stack underflow.

## Items Let Go

- Destructuring patterns (#3) — not used in this codebase at top level
- Non-recursive directory traversal (#6) — Sources/ is flat
- ESLint cross-check documentation (#9) — separate manual step, not needed for section-01 deliverable
