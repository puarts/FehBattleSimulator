Now I have all the context needed. Let me produce the section content.

# Section 06: Vue 3 Core Migration

## Overview

This section covers the installation of Vue 3, migration from `new Vue()` to `createApp()`, removal of Vue 2 / Vuex CDN script tags, enabling the runtime compiler alias (`vue.esm-bundler.js`), and addressing Vue 2 breaking changes. Pinia migration (Section 07) and component migration (Section 08) are handled in subsequent sections; this section focuses on the core Vue 3 foundation.

**Plan Steps**: D.1, D.2, D.6

## Dependencies

- **Section 02 (Vite Build)**: `vite.config.js` must exist and Vite build must be functional
- **Section 05 (Dev Server)**: Vite dev server must be operational with `<script type="module">` entry points

## Files to Create or Modify

| File | Action |
|------|--------|
| `package.json` | Add `vue@3` dependency; remove Vue 2 CDN reliance |
| `vite.config.js` | Add `resolve.alias` for `vue` to `vue/dist/vue.esm-bundler.js` |
| `Sources/BattleSimulatorBase.js` | Rewrite `#create_vue()` from `new Vue()` / `new Vuex.Store()` to `createApp().mount()` |
| `Sources/DamageCalculatorMain.js` | Rewrite `new Vue()` at line 1082 to `createApp().mount()` |
| `Sources/StatusCalcMain.js` | Rewrite `new Vue()` at line 82 to `createApp().mount()` |
| `Sources/HeroIconListerMain.js` | Rewrite `new Vue()` at line 86 to `createApp().mount()` |
| `Sources/HeroStatusClustererMain.js` | Rewrite `new Vue()` at line 636 to `createApp().mount()` |
| `Sources/VueComponents.js` | Refactor `initVueComponents()` to accept `app` instance; change `Vue.component()` to `app.component()` |
| `Sources/CustomSkill.js` | Replace `vm.$set()` at line 192 with direct assignment |
| All 8 HTML files under `Sources/` | Remove Vue 2 and Vuex CDN `<script>` tags |

## Tests

Tests should be written first and initially fail, then pass after implementation.

### Test File: `Tests/Vue3Core.test.js`

```javascript
/**
 * Vue 3 Core Migration Tests
 *
 * Validates that Vue 3 is properly installed and configured,
 * CDN references are removed, and Vue 2 deprecated APIs are eliminated.
 */

import { createApp } from 'vue';
import fs from 'fs';
import path from 'path';

describe('D.1 Vue 3 Installation', () => {
    test('import { createApp } from vue resolves successfully', () => {
        expect(typeof createApp).toBe('function');
    });

    test('Vue 3 runtime compiler build is configured via alias', () => {
        // Read vite.config.js and verify the alias points to vue.esm-bundler.js
        const configContent = fs.readFileSync(
            path.resolve(__dirname, '../vite.config.js'), 'utf-8'
        );
        expect(configContent).toContain('vue.esm-bundler.js');
    });

    test('CDN Vue 2 script tags are removed from all HTML files', () => {
        const htmlDir = path.resolve(__dirname, '../Sources');
        const htmlFiles = fs.readdirSync(htmlDir).filter(f => f.endsWith('.html'));
        for (const file of htmlFiles) {
            const content = fs.readFileSync(path.join(htmlDir, file), 'utf-8');
            expect(content).not.toContain('vue/2.5.13');
            expect(content).not.toContain('vue.min.js');
        }
    });

    test('CDN Vuex script tags are removed from all HTML files', () => {
        const htmlDir = path.resolve(__dirname, '../Sources');
        const htmlFiles = fs.readdirSync(htmlDir).filter(f => f.endsWith('.html'));
        for (const file of htmlFiles) {
            const content = fs.readFileSync(path.join(htmlDir, file), 'utf-8');
            expect(content).not.toContain('vuex@3.6.2');
            expect(content).not.toContain('vuex.min.js');
        }
    });
});

describe('D.2 Vue Instance Migration', () => {
    test('createApp() creates a Vue application successfully', () => {
        const app = createApp({ data() { return { msg: 'hello' }; } });
        expect(app).toBeDefined();
        expect(typeof app.mount).toBe('function');
    });

    test('data option is a function, not a plain object', () => {
        // Grep source files to verify data is always a function
        const filesToCheck = [
            'Sources/BattleSimulatorBase.js',
            'Sources/DamageCalculatorMain.js',
            'Sources/StatusCalcMain.js',
            'Sources/HeroIconListerMain.js',
            'Sources/HeroStatusClustererMain.js',
        ];
        for (const file of filesToCheck) {
            const content = fs.readFileSync(
                path.resolve(__dirname, '..', file), 'utf-8'
            );
            // Should not contain `data: appData` or `data: g_appData` (plain object)
            // Should contain `data()` or `data: function` pattern
            expect(content).not.toMatch(/createApp\(\{[^}]*data:\s*[a-zA-Z_]+[^(]/);
        }
    });
});

describe('D.6 Breaking Changes Elimination', () => {
    test('Vue.set and $set are not used in source code', () => {
        const srcDir = path.resolve(__dirname, '../Sources');
        const jsFiles = fs.readdirSync(srcDir).filter(f => f.endsWith('.js'));
        for (const file of jsFiles) {
            const content = fs.readFileSync(path.join(srcDir, file), 'utf-8');
            // Allow commented-out lines (e.g., // this.$set)
            const lines = content.split('\n').filter(l => !l.trim().startsWith('//'));
            const activeContent = lines.join('\n');
            expect(activeContent).not.toMatch(/Vue\.set\s*\(/);
            expect(activeContent).not.toMatch(/\.\$set\s*\(/);
        }
    });

    test('$delete is not used in source code', () => {
        const srcDir = path.resolve(__dirname, '../Sources');
        const jsFiles = fs.readdirSync(srcDir).filter(f => f.endsWith('.js'));
        for (const file of jsFiles) {
            const content = fs.readFileSync(path.join(srcDir, file), 'utf-8');
            const lines = content.split('\n').filter(l => !l.trim().startsWith('//'));
            expect(lines.join('\n')).not.toMatch(/\.\$delete\s*\(/);
        }
    });

    test('beforeDestroy / destroyed hooks are not used', () => {
        const srcDir = path.resolve(__dirname, '../Sources');
        const jsFiles = fs.readdirSync(srcDir).filter(f => f.endsWith('.js'));
        for (const file of jsFiles) {
            const content = fs.readFileSync(path.join(srcDir, file), 'utf-8');
            // Skip skill text comments that mention "destroyed"
            const lines = content.split('\n').filter(l => !l.trim().startsWith('//'));
            const activeContent = lines.join('\n');
            expect(activeContent).not.toMatch(/\bbeforeDestroy\s*\(\)/);
            expect(activeContent).not.toMatch(/\bdestroyed\s*\(\)/);
        }
    });

    test('$on, $off, $once are not used in source code', () => {
        const srcDir = path.resolve(__dirname, '../Sources');
        const jsFiles = fs.readdirSync(srcDir).filter(f => f.endsWith('.js'));
        for (const file of jsFiles) {
            const content = fs.readFileSync(path.join(srcDir, file), 'utf-8');
            const lines = content.split('\n').filter(l => !l.trim().startsWith('//'));
            const activeContent = lines.join('\n');
            expect(activeContent).not.toMatch(/\.\$on\s*\(/);
            expect(activeContent).not.toMatch(/\.\$off\s*\(/);
            expect(activeContent).not.toMatch(/\.\$once\s*\(/);
        }
    });

    test('$children is not used in source code', () => {
        const srcDir = path.resolve(__dirname, '../Sources');
        const jsFiles = fs.readdirSync(srcDir).filter(f => f.endsWith('.js'));
        for (const file of jsFiles) {
            const content = fs.readFileSync(path.join(srcDir, file), 'utf-8');
            const lines = content.split('\n').filter(l => !l.trim().startsWith('//'));
            expect(lines.join('\n')).not.toMatch(/\.\$children/);
        }
    });
});
```

Register this test file in the Vitest configuration (or `create_tests.sh` if still in the transitional period).

## Implementation Details

### 1. Install Vue 3

Add `vue@3` as a **production dependency** (not devDependency, since it ships in the bundle):

```
npm install vue@3
```

Do not install Pinia yet --- that is Section 07's responsibility. During this transitional step, the Vuex store will be temporarily replaced with a simple reactive object or removed, and Pinia will be formally introduced in the next section.

### 2. Configure the Runtime Compiler Alias in `vite.config.js`

This project uses HTML inline templates (not SFCs), so the Vue runtime compiler is required. Add the following `resolve.alias` to the existing `vite.config.js`:

```javascript
resolve: {
    alias: {
        vue: 'vue/dist/vue.esm-bundler.js',
    },
},
```

Without this alias, Vue 3 defaults to the runtime-only build which cannot compile templates found in the DOM.

### 3. Remove CDN Script Tags from HTML Files

Remove the following `<script>` tags from all 8 HTML files:

- `<script src="https://cdnjs.cloudflare.com/ajax/libs/vue/2.5.13/vue.min.js"></script>`
- `<script src="https://unpkg.com/vuex@3.6.2/dist/vuex.min.js"></script>`

The affected files are:
- `Sources/ArenaSimulator.html`
- `Sources/AetherRaidSimulator.html`
- `Sources/SummonerDuelsSimulator.html`
- `Sources/UnitBuilder.html`
- `Sources/DamageCalculator.html`
- `Sources/StatusCalculator.html`
- `Sources/HeroIconLister.html`
- `Sources/HeroStatusClusterer.html`

Note: `StatusCalculator.html` loads Vue via `createScriptElement()` dynamically (line 297) rather than a static `<script>` tag. This dynamic loading call must also be removed.

### 4. Migrate Vue Instance Creation

Each entry point that creates a Vue instance must be rewritten from the Vue 2 pattern to Vue 3.

#### 4a. `Sources/BattleSimulatorBase.js` --- `#create_vue()` method (line 133)

**Current** (Vue 2 + Vuex):
```javascript
Vue.use(Vuex);
const store = new Vuex.Store({
    state: { appData, battleSimulator: this, imageRootPath: g_imageRootPath },
    mutations: {},
    actions: { updateMap, saveSettings, ... }
});
return new Vue({
    el: "#app",
    store,
    data: appData,
    methods: this.methods,
});
```

**Target** (Vue 3, temporary store via `provide`/`inject` or `app.config.globalProperties`):
```javascript
import { createApp } from 'vue';

// data must be a function
const app = createApp({
    data() { return appData; },
    methods: this.methods,
});

// Temporarily expose store-like state via globalProperties
// (Pinia migration in Section 07 will replace this)
app.config.globalProperties.$store = {
    state: {
        appData: appData,
        battleSimulator: this,
        imageRootPath: g_imageRootPath,
    },
    dispatch(action) { /* temporary stub calling the action functions directly */ }
};

// Register components before mounting (see VueComponents.js changes)
initVueComponents(app);

app.mount('#app');
return app;
```

The key change: `data: appData` (plain object) must become `data() { return appData; }` (function). In Vue 3, `data` must always be a function, even on the root instance.

The Vuex store replacement strategy has two options:
1. **Temporary `globalProperties`**: Expose `$store.state` via `app.config.globalProperties` so components using `Vuex.mapState()` continue to work with a shimmed `mapState`. This is the recommended approach for this section.
2. **Defer to Section 07**: Leave components partially broken until Pinia is integrated. Not recommended as it prevents incremental testing.

For the temporary shim, create a minimal `mapState` replacement that reads from `app.config.globalProperties.$store.state`:

```javascript
// Temporary Vuex shim (to be removed in Section 07)
function mapStateShim(keys) {
    const result = {};
    for (const key of keys) {
        result[key] = function() { return this.$store.state[key]; };
    }
    return result;
}
```

Replace all `Vuex.mapState(...)` references in `VueComponents.js` with `mapStateShim(...)`.

#### 4b. `Sources/DamageCalculatorMain.js` (line 1082)

**Current**:
```javascript
g_damageCalcVm = new Vue({
    el: "#damageCalc",
    data: g_damageCalcData,
    methods: { ... }
});
```

**Target**:
```javascript
import { createApp } from 'vue';
const app = createApp({
    data() { return g_damageCalcData; },
    methods: { ... }
});
app.mount('#damageCalc');
g_damageCalcVm = app;
```

Note: The returned value changes from a Vue instance to an app instance. If code accesses `g_damageCalcVm` properties, use `app._instance.proxy` or store a reference to the mounted component proxy. Alternatively, keep the data object reference (`g_damageCalcData`) for direct property access.

#### 4c. `Sources/StatusCalcMain.js` (line 82)

Same pattern: `new Vue({ el, data, methods })` to `createApp({ data(), methods }).mount()`.

#### 4d. `Sources/HeroIconListerMain.js` (line 86)

Same pattern. This instance is simple with no methods, only `data`.

#### 4e. `Sources/HeroStatusClustererMain.js` (line 636)

Same pattern with `data` and `methods`.

### 5. Migrate `VueComponents.js` --- `initVueComponents()`

Currently, `initVueComponents()` uses `Vue.component()` for global registration. In Vue 3, components are registered on the app instance via `app.component()`.

**Change the function signature** to accept the `app` instance:

```javascript
function initVueComponents(app) {
    app.component('battle-map', { ... });
    app.component('unit-detail', { ... });
    // ... all other components
}
```

Every `Vue.component('name', definition)` call becomes `app.component('name', definition)`.

This function must be called **before** `app.mount()` in each entry point.

### 6. Address Vue 2 Breaking Changes

#### 6a. `$set` / `Vue.set` removal

The following locations must be changed:

1. **`Sources/BattleSimulatorBase.js` line 438**: `this.$set(values, i, value)` --- Replace with `values[i] = value;` (Vue 3 Proxy reactivity tracks index assignment on arrays).

2. **`Sources/BattleSimulatorBase.js` line 440**: `this.$set(values, i + 1, '')` --- Replace with `values[i + 1] = '';`

3. **`Sources/VueComponents.js` line 2108**: `this.$set(this, 'rows', results)` --- Replace with `this.rows = results;`

4. **`Sources/VueComponents.js` line 2321**: `Vue.set(this.rows, originalIndex, { ... })` --- Replace with `this.rows[originalIndex] = { ... };` or use `this.rows.splice(originalIndex, 1, newObj)` for guaranteed reactivity on array index assignment.

5. **`Sources/CustomSkill.js` line 192**: `vm.$set(customSkill, 1, { ... })` --- Replace with `customSkill[1] = { ... };`

6. **`Sources/BattleSimulatorBase.js` line 422**: Already commented out, no action needed.

#### 6b. `beforeDestroy` to `beforeUnmount`

**`Sources/VueComponents.js` line 832** (select2 component): Change `beforeDestroy()` to `beforeUnmount()`.

#### 6c. `$children` removal

**`Sources/VueComponents.js` line 3008** (log-node component): `this.$children.forEach(c => c.setOpenAll && c.setOpenAll(val))` --- Vue 3 removed `$children`. Replace with template refs:

- Add `ref="childNodes"` to child `<log-node>` components in the template
- Use `this.$refs.childNodes` (returns an array when used inside `v-for`)
- Call `setOpenAll` on each ref

Alternatively, use `provide`/`inject` to propagate the open/close state downward without direct child access.

#### 6d. `v-model` on custom components

In Vue 2, `v-model` on a custom component binds to `value` prop and emits `input` event. In Vue 3, it binds to `modelValue` prop and emits `update:modelValue`.

The `select2` component in `VueComponents.js` uses:
- `props: { value: ... }` --- must become `modelValue`
- `this.$emit('input', newVar)` at line 757 --- must become `this.$emit('update:modelValue', newVar)`

The `unit-detail` component receives `value` via props and uses `v-model` in its template. The `value` prop should be renamed to `modelValue`.

All parent templates using `<select2 v-model="xxx">` and `<unit-detail v-model="xxx">` will automatically work with the new convention since Vue 3 handles `v-model` to `modelValue`/`update:modelValue` mapping.

#### 6e. Global variables in templates

Vue 3 templates cannot reference variables that are not explicitly defined in `data`, `methods`, `computed`, or `setup`. If any HTML templates reference global variables directly (e.g., `{{ UnitRarity }}`), these must be exposed.

Looking at the templates, `UnitRarity` is referenced in the `unit-detail` component template (line 48 of VueComponents.js). This is a global enum. Options to fix:

1. Add to `app.config.globalProperties`: `app.config.globalProperties.UnitRarity = UnitRarity;`
2. Include in each component's `data()` or `computed`.

Use `app.config.globalProperties` for widely-used constants. Audit all templates for similar global references and register them.

### 7. Import Statements

Add the necessary import at the top of each modified file:

```javascript
import { createApp } from 'vue';
```

For `VueComponents.js`, no Vue import is needed since it only defines component option objects (plain JS objects). The `Vuex` global reference must be removed (replaced by the temporary shim or deferred to Section 07).

### 8. Verification Checklist

After implementation:

- [ ] `vite build` completes without errors
- [ ] `vite` dev server starts and each simulator page renders
- [ ] No console errors referencing `Vue`, `Vuex`, `$set`, `$delete`, `$children`, or `beforeDestroy`
- [ ] All Vitest tests pass (including the new `Vue3Core.test.js`)
- [ ] The 8 simulator pages render their Vue-driven UI correctly (manual check)

## Risks and Mitigations

**Vuex removal before Pinia**: Removing Vuex CDN while Pinia is not yet installed creates a gap. The temporary `mapState` shim and `$store` via `globalProperties` bridges this gap. If the shim proves too fragile, consider installing Pinia in this section as a minimal store, even before the formal Section 07 migration.

**Select2 jQuery interaction with Vue 3 Proxy**: The `select2` component wrapper uses jQuery to manipulate the DOM. Vue 3's Proxy-based reactivity may interfere. Since this section only changes the Vue core (not the Select2 wrapper internals), the risk is limited. However, test the select2 dropdowns manually after migration. If broken, the `select2` component can temporarily keep its jQuery-based implementation unchanged --- the full replacement happens in Section 09.

**Template global variable access**: It is difficult to enumerate all global variables used in HTML templates by static analysis alone. After the initial migration, runtime errors in the browser console (`xxx is not defined`) will reveal missing globals. Add each to `app.config.globalProperties` as discovered.

## 実装結果（実績）

### 実施した作業

1. **Vue 3 インストール**: `npm install vue@3` — production dependency として追加
2. **vite.config.js 更新**: `@vitejs/plugin-vue` 有効化、`vue.esm-bundler.js` alias、Vue feature flags（`__VUE_OPTIONS_API__` 等）
3. **CDN スクリプト除去**: 全8 HTML から Vue 2.5.13 / Vuex 3.6.2 / Vue.Draggable 2.23.2 CDN タグを除去
4. **Vue インスタンス移行**: 5箇所の `new Vue()` を `createApp().mount()` に変更
   - `BattleSimulatorBase.js` — temporary Vuex shim（`$store` via `globalProperties`）付き
   - `DamageCalculatorMain.js`, `StatusCalcMain.js`, `HeroIconListerMain.js`, `HeroStatusClustererMain.js`
5. **VueComponents.js 移行**:
   - `initVueComponents()` が `app` パラメータを受け取るように変更
   - `Vue.component()` → `app.component()` (30+箇所)
   - `Vuex.mapState()` → `mapStateShim()` (16箇所)
   - `model: { prop: 'unit' }` オプション除去 (11箇所) — 親テンプレートを `:unit="..."` に変更
   - `select2` コンポーネント: `value` → `modelValue`, `$emit('input')` → `$emit('update:modelValue')` + backward compat `input`
   - `beforeDestroy` → `beforeUnmount`
   - `$children` → `$refs.childNodes`
   - `$set` / `Vue.set` → 直接代入 / `splice`
6. **Breaking changes 対処**:
   - HTML `v-model` on read-only components → `:value="..."` / `:unit="..."` に変更
   - グローバル変数15個を `app.config.globalProperties` に登録
   - `HeroStatusClustererMain.js` に stub `$store` 追加
7. **CustomSkill.js**: `vm.$set()` → 直接代入

### 変更ファイル一覧

| ファイル | 操作 |
|---------|------|
| `package.json` | `vue@3` dependency 追加 |
| `vite.config.js` | Vue plugin 有効化、alias、feature flags |
| `Sources/VueComponents.js` | Vue 3 API 移行（最大変更） |
| `Sources/BattleSimulatorBase.js` | `createApp` + Vuex shim + globalProperties |
| `Sources/CustomSkill.js` | `$set` 除去 |
| `Sources/*Main.js` (8ファイル) | `createApp` 移行、`initVueComponents` 呼び出し整理 |
| `Sources/*.html` (7ファイル) | CDN 除去、v-model → prop binding |
| `Tests/Vue3Core.test.js` | 新規作成（9テスト） |

### テスト結果

- 384テスト全パス（24ファイル）
- 手動確認項目: dev server 起動、各ページレンダリング、コンソールエラー確認