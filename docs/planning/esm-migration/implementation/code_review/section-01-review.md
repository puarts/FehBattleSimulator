# Code Review: section-01-ast-analysis-tool

## Critical

None found.

## Important

### 1. `acorn-walk` imported but never used (ast-extractor.js line 2)
The file imports `acorn-walk` via `const walk = require('acorn-walk')` but never uses it. The implementation builds its own custom recursive walker. The unused import should be removed.

### 2. global-assignment classification is too narrow (side-effect-classifier.js)
The `classifyStatement` for `VariableDeclaration` only detects `global-assignment` when the variable name starts with `g_` AND the initializer contains a `NewExpression`. This misses patterns like `const g_foo = fetchData()` without `new`.

### 3. Destructuring patterns not handled in definition extraction
Top-level definition extraction only handles `Identifier` patterns. Destructuring at top level (e.g., `const { a, b } = obj;`) would silently drop names.

### 4. Double-parsing of source code
Both `extractSymbols(code)` and `classifySideEffects(code)` parse independently. The AST should be parsed once and shared.

### 5. No `test:tools` integration with CI
The `test:tools` script is not included in the CI pipeline. Regressions won't be caught automatically.

## Minor

### 6. Non-recursive directory traversal
CLI only finds JS files in immediate directory, not subdirectories.

### 7. `popScope` has no guard against empty stack
Could silently cause issues if walker has bugs.

### 8. Missing test for `global-assignment` via ExpressionStatement
The assignment expression path (`g_appData = new AppData()`) has no test coverage.

### 9. ESLint cross-check documentation not produced
Plan specifies ESLint `no-undef` cross-check but it was not implemented.

## Observation

- `global-symbols.json` is a large generated artifact being committed. Consider `.gitignore`.
- `acorn-walk` should be removed from dependencies if unused.
