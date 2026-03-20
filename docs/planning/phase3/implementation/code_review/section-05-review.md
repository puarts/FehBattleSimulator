# Code Review: section-05-dev-server

## Summary

The diff creates env scaffolding (`.env.development`, `.env.production`), adds `server.cors` to vite.config.js, writes tests, and updates `.gitignore`. Most HTML cleanup and initialization migration was already done in section-02.

## Findings

### 1. No import.meta.env integration in source code (HIGH)
The plan requires replacing `typeof weaponInfos == 'undefined'` with `import.meta.env.MODE` branching. The `.env` files are created but never consumed by any source code. The `*Main.js` files unconditionally import data from `SampleSkillInfos.js` / `SampleHeroInfos.js`.

### 2. No dev/prod data loading branching (HIGH)
Plan Step C.1 specifies: development imports local files, production uses CDN globals. The diff contains no such branching. Production builds will bundle sample data.

### 3. HTML cleanup already done in section-02 (MEDIUM - documentation)
Steps C.2 (remove createScriptElement, loadScripts, Local.js) were completed in a prior section. Should be documented.

### 4. Initialization code migration already done (MEDIUM - documentation)
Moving `g_app.registerSkillOptions()` to `*Main.js` was done in section-02.

### 5. Unused `glob` import in DevServerHtml.test.js (LOW)
`import { glob } from 'glob'` is imported but never used.

### 6. Inconsistent vitest imports (LOW)
`beforeAll` not imported explicitly - works via `globals: true` but inconsistent with explicit imports of `describe/it/expect`.

### 7. Test coverage gap for runtime behavior (MEDIUM)
Plan specifies testing `import.meta.env.MODE` runtime behavior and production build output. Actual tests only check `.env` file existence.

### 8. Minimal server config (LOW)
Only `cors: true` added. No explanation for omitting proxy/port settings from plan.
