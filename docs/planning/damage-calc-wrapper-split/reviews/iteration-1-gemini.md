# Gemini Review

**Model:** gemini-3-pro-preview
**Generated:** 2026-03-28T11:24:16.678049

---

This is a highly structured, well-thought-out, and pragmatic implementation plan. The choice of Prototype Extension (`Object.assign(Class.prototype, {...})`) is the correct tactical decision for safely splitting a 17,000-line monolithic class without rewriting the internal architecture or changing the 1,270+ `this` bindings.

However, as a senior architect reviewing this, I have identified several critical footguns, tooling implications, and JavaScript-specific edge cases that are missing from the plan and could cause runtime crashes or severely degrade the developer experience.

Here is my unconstrained assessment, categorized by priority.

---

### 🚨 1. Critical Footguns & Runtime Risks

#### A. Lexical Scope vs. Prototype Scope (File-level variables)
**Reference:** Section 2.1 (Prototype拡張パターン)
**The Risk:** The plan assumes that moving a method to a new file is safe as long as `this` is preserved. This ignores **file-scoped variables** (lexical scope).
If `DamageCalculatorWrapper.js` defines constants, helper functions, or enums *outside* the `class {}` block (e.g., `const MAX_DAMAGE = 99;` or `const WEAPON_TYPE_SWORD = 0;`), methods moved to `_Spur.js` or `_ApplySkillEffects.js` will throw a `ReferenceError` when they try to access them.
**Actionable Fix:**
- Before moving any methods, audit the top and bottom of `DamageCalculatorWrapper.js` for variables/constants defined outside the class.
- If they exist, they must be extracted into a shared constant file (e.g., `combat/DamageCalcConstants.js`) and imported/loaded before the new prototype files, or attached to the class statically (`DamageCalculatorWrapper.MAX_DAMAGE`).

#### B. Native ES2022 Private Fields/Methods (`#`)
**Reference:** Section 3.3 / 4.2
**The Risk:** The plan relies heavily on methods prefixed with `__` (e.g., `__applySkillEffect`). If these are purely naming conventions, Prototype Extension works perfectly. However, if the codebase uses actual JS native private fields/methods (e.g., `#applySkillEffect`), **Prototype Extension will fail**. Native private fields are strictly scoped to the lexical `class {}` block and cannot be accessed or added via prototype manipulation in external files.
**Actionable Fix:**
- Verify with a regex search (`#\w+`) that the class does not use native private fields/methods. If it does, those specific methods *must* remain in the core file.

#### C. The `Object.assign` Enumerability Trap
**Reference:** Section 2.2.1 and 7.1
**The Risk:** The plan notes that `Object.assign` makes methods enumerable, whereas standard ES6 class methods are non-enumerable. The plan assumes this is safe because `for...in` is rarely used. This is a dangerous assumption in a complex legacy codebase; it could break serialization (JSON.stringify), logging, or deep-clone utilities.
**Actionable Fix:**
- **Do not use `Object.assign`.** Instead, write a tiny helper function that copies methods while preserving their non-enumerable descriptors. This guarantees "zero logic change" at the VM level.
```javascript
// Add this helper to the bottom of the Core file
DamageCalculatorWrapper.extendPrototype = function(methods) {
    const descriptors = Object.getOwnPropertyDescriptors(methods);
    for (const key in descriptors) {
        descriptors[key].enumerable = false; // Force non-enumerable like standard class methods
    }
    Object.defineProperties(DamageCalculatorWrapper.prototype, descriptors);
};

// In the split files:
DamageCalculatorWrapper.extendPrototype({
    __init__applySkillEffectForAtkUnitFuncDict() { ... }
});
```

---

### 🛠 2. Tooling & Developer Experience (DX) Issues

#### A. Destruction of `git blame`
**Reference:** Section 5 (実装手順)
**The Risk:** Moving 15,000 lines of code across new files will completely destroy Git history. When a bug is found in `__examinesCanFollowupAttackForAttacker`, `git blame` will point to your refactor commit, hiding the original context and author.
**Actionable Fix:**
- Add a strict Git strategy to the plan. You must use a tool or technique to preserve history.
- The safest way: Copy the original file 4 times. In each new file, *delete* the code that doesn't belong. Git is much better at tracking history for deleted lines in copied files than cut-and-pasted code. Commit this as a single, isolated refactor commit.

#### B. ESLint / IDE IntelliSense Breakage
**Reference:** Section 5.6 (ESLint パス確認)
**The Risk:** Splitting a class via Prototype Extension will break static analysis.
- **ESLint:** If `_Spur.js` contains `this.__isNear()`, ESLint might throw a `no-undef` or a missing property error because it doesn't know `__isNear` exists on the prototype defined in this specific file.
- **IDE (VSCode, WebStorm):** "Go to Definition" and autocomplete will likely fail across the split files.
**Actionable Fix:**
- You will likely need to suppress specific ESLint rules at the top of the new files (e.g., `/* eslint-disable no-invalid-this */`). Add this to the plan's risk section.
- For IDE support, consider adding JSDoc `@mixin` or `@this {DamageCalculatorWrapper}` to the top of the newly extracted objects so the IDE understands the context of `this`.

---

### 🏗 3. Architectural & Implementation Tweaks

#### A. Test Environment Module Loading
**Reference:** Section 6 (ロード順序の更新)
**The Risk:** The plan perfectly covers HTML script tags and batch file concatenation. However, how does Node.js (`create_tests.sh` / Jest / Mocha) load these files? If the test environment uses `require()` or `import` instead of just evaluating files in a global context, attaching to the prototype in a separate file won't execute unless the core file explicitly `require`s the extension files.
**Actionable Fix:**
- Verify the test environment's module system. If it's standard CommonJS, you must add `require('./DamageCalculatorWrapper_Spur.js')` at the bottom of the `DamageCalculatorWrapper.js` core file.

#### B. Exact Boundary Mapping
**Reference:** Section 4.2 (ファイル2: `____applySkillEffectForUnit` の開始位置)
**The Risk:** The plan notes the need to find the exact boundary between `__init__applySkillEffectForUnitFuncDict` (Dictionary init) and `____applySkillEffectForUnit` (Dictionary lookup). Splitting a dictionary initialization and its corresponding lookup into two separate files (File 1 and File 2) creates a high risk of mental disconnect for future maintainers.
**Actionable Fix:**
- If a dictionary and its lookup function are highly coupled (e.g., adding a new skill requires touching both), **they should be in the same file**. Consider adjusting the split so `InitSkillEffectDict` and `ApplySkillEffects` are grouped by domain (e.g., Atk/Def vs. Special) rather than strictly separating "Init" vs "Apply".

---

### 📝 Summary of Additions to the Plan

To make this plan bulletproof, I recommend adding the following explicitly to your document:

1. **Pre-flight Check:** Regex search for variables declared outside the `class {}` scope in the core file, and `#` private fields.
2. **Implementation Update:** Replace `Object.assign` with `Object.defineProperties` (via a helper) to maintain `enumerable: false`.
3. **DX Strategy:** Define how to commit this to Git to preserve `git blame`, and note that JSDoc `@this` might be needed for IDE sanity.
4. **Coupling check:** Re-evaluate separating `__init__...FuncDict` from its direct consumer `____apply...ForUnit` across two different files.

The core strategy is sound. Incorporating these safety nets will ensure the "zero logic change" goal is strictly met at the VM and Tooling levels.
