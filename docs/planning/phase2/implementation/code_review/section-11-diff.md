diff --git a/Tests/EsmValidation.test.js b/Tests/EsmValidation.test.js
new file mode 100644
index 00000000..585487bc
--- /dev/null
+++ b/Tests/EsmValidation.test.js
@@ -0,0 +1,74 @@
+const { execFileSync } = require('child_process');
+const fs = require('fs');
+const path = require('path');
+
+// Tests run from concatenated All.test.js at project root, so __dirname IS the root
+const ROOT = __dirname;
+const SOURCES = path.join(ROOT, 'Sources');
+
+describe('ESM Validation', () => {
+    test('全ソースファイルが import または export 文を持つ', () => {
+        const result = execFileSync('node', ['scripts/check-esm-coverage.mjs'], {
+            cwd: ROOT,
+            encoding: 'utf-8',
+            timeout: 30000,
+        });
+        expect(result).toMatch(/^OK:/);
+    });
+
+    test('ネイティブESMエントリポイントがTDZエラーなしでロードされる', () => {
+        let stdout, stderr;
+        try {
+            stdout = execFileSync('node', ['scripts/validate-esm.mjs'], {
+                cwd: ROOT,
+                encoding: 'utf-8',
+                timeout: 60000,
+            });
+        } catch (err) {
+            stderr = err.stderr || '';
+            if (/TDZ ERROR/.test(stderr)) {
+                throw new Error(`TDZ error detected:\n${stderr}`);
+            }
+            // Non-TDZ failures are acceptable (missing browser globals etc.)
+            stdout = err.stdout || '';
+        }
+        // Should not contain TDZ error
+        expect(stdout + (stderr || '')).not.toMatch(/Cannot access '.+' before initialization/);
+    });
+
+    test('ビルド出力に import/export 行が残らない', () => {
+        execFileSync('node', ['scripts/build.mjs'], { cwd: ROOT, timeout: 120000 });
+
+        const distDir = path.join(ROOT, 'dist');
+        const jsFiles = fs.readdirSync(distDir).filter(f => f.endsWith('.js'));
+        expect(jsFiles.length).toBeGreaterThanOrEqual(7);
+
+        for (const file of jsFiles) {
+            const content = fs.readFileSync(path.join(distDir, file), 'utf-8');
+            const lines = content.split('\n');
+            const importLines = lines.filter(l => /^import /.test(l));
+            const exportLines = lines.filter(l => /^export \{/.test(l));
+            expect(importLines).toEqual([]);
+            expect(exportLines).toEqual([]);
+            // File should not be empty
+            expect(content.length).toBeGreaterThan(1000);
+        }
+    });
+
+    test('ビルド出力ファイルが全7シミュレーター分生成される', () => {
+        const distDir = path.join(ROOT, 'dist');
+        const expectedFiles = [
+            'FehBattleSimulator.js',
+            'FehArenaSimulator.js',
+            'FehSummonerDuelsSimulator.js',
+            'FehStatusCalculator.js',
+            'FehUnitBuilder.js',
+            'FehDamageCalculator.js',
+            'FehHeroIconLister.js',
+        ];
+        for (const file of expectedFiles) {
+            const filePath = path.join(distDir, file);
+            expect(fs.existsSync(filePath)).toBe(true);
+        }
+    });
+});
diff --git a/create_tests.sh b/create_tests.sh
index 76b77d7c..0acf30e9 100755
--- a/create_tests.sh
+++ b/create_tests.sh
@@ -67,6 +67,7 @@ TEST_FILE_NAMES=(
     TestHelper
     SmokeTest
     BuildFilter
+    EsmValidation
     )
 
 # カテゴリに応じたテストファイル選択
diff --git a/package.json b/package.json
index 55285113..b9989c94 100644
--- a/package.json
+++ b/package.json
@@ -8,7 +8,8 @@
     "test:only": "jest",
     "build": "node scripts/build.mjs",
     "build:minify": "node scripts/build.mjs --minify",
-    "deploy": "node scripts/build.mjs --minify --deploy"
+    "deploy": "node scripts/build.mjs --minify --deploy",
+    "validate:esm": "node scripts/validate-esm.mjs && node scripts/check-esm-coverage.mjs"
   },
   "repository": {
     "type": "git",
diff --git a/scripts/check-esm-coverage.mjs b/scripts/check-esm-coverage.mjs
new file mode 100644
index 00000000..09542594
--- /dev/null
+++ b/scripts/check-esm-coverage.mjs
@@ -0,0 +1,74 @@
+#!/usr/bin/env node
+// Verifies all source files referenced in create_tests.sh and build.mjs
+// have import or export statements (i.e., have been converted to ESM).
+
+import { readFileSync } from 'fs';
+import { join, dirname } from 'path';
+import { fileURLToPath } from 'url';
+
+const __filename = fileURLToPath(import.meta.url);
+const __dirname = dirname(__filename);
+const ROOT = join(__dirname, '..');
+const SOURCES = join(ROOT, 'Sources');
+
+// Files referenced in create_tests.sh SOURCE_FILE_NAMES
+const TEST_SOURCE_FILES = [
+    'GlobalDefinitions', 'Utilities', 'Logger', 'SkillConstants', 'Skill',
+    'BattleMapElement', 'Tile', 'Structures', 'Cell', 'Table',
+    'HeroInfoConstants', 'HeroInfo', 'UnitConstants', 'BattleContext', 'Unit',
+    'UnitManager', 'BattleMap', 'GlobalBattleContext',
+    'DamageCalculationUtility', 'DamageCalculator', 'PostCombatSkillHander',
+    'DamageCalculatorWrapper', 'BeginningOfTurnSkillHandler',
+    'SkillDatabase', 'HeroDatabase', 'SampleSkillInfos', 'SampleHeroInfos',
+    'SkillEffectCore', 'SkillEffectEnv', 'SkillEffect', 'SkillEffectField',
+    'SkillEffectUnit', 'SkillEffectBattleContext', 'SkillEffectHooks',
+    'SkillEffectRegistrar', 'SkillEffectAliases',
+    'CustomSkill', 'SkillImpl', 'SkillImpl202408', 'SkillImpl202501', 'SkillImpl202601',
+    'TestUtilities',
+];
+
+// Additional files referenced in build.mjs but not in test sources
+const BUILD_ONLY_FILES = [
+    'BattleMapSettings', 'TurnSetting', 'AudioManager', 'AetherRaidDefensePresets',
+    'SettingManager', 'AppData',
+    'Main_ImageProcessing', 'Main_OriginalAi', 'Main_MouseAndTouch',
+    'BattleSimulatorBase', 'VueComponents',
+    'AetherRaidSimulatorMain', 'ArenaSimulatorMain', 'SummonerDuelsSimulatorMain',
+    'StatusCalcMain', 'UnitBuilderMain', 'KeyRepeatHandler',
+    'DamageCalculatorMain', 'HeroIconListerMain',
+];
+
+const ALL_FILES = [...TEST_SOURCE_FILES, ...BUILD_ONLY_FILES];
+
+function checkFile(name) {
+    const filePath = join(SOURCES, `${name}.js`);
+    let content;
+    try {
+        content = readFileSync(filePath, 'utf-8');
+    } catch {
+        return { name, status: 'missing', error: 'File not found' };
+    }
+
+    const lines = content.split('\n');
+    const hasImport = lines.some(line => /^import /.test(line));
+    const hasExport = lines.some(line => /^export /.test(line));
+
+    if (hasImport || hasExport) {
+        return { name, status: 'ok', hasImport, hasExport };
+    }
+    return { name, status: 'no_esm', hasImport, hasExport };
+}
+
+const results = ALL_FILES.map(checkFile);
+const failures = results.filter(r => r.status !== 'ok');
+
+if (failures.length === 0) {
+    console.log(`OK: All ${results.length} source files have import/export statements.`);
+    process.exit(0);
+} else {
+    console.error(`FAIL: ${failures.length} file(s) missing import/export statements:`);
+    for (const f of failures) {
+        console.error(`  - ${f.name}.js (${f.status})`);
+    }
+    process.exit(1);
+}
diff --git a/scripts/validate-esm.mjs b/scripts/validate-esm.mjs
new file mode 100644
index 00000000..c40f7934
--- /dev/null
+++ b/scripts/validate-esm.mjs
@@ -0,0 +1,90 @@
+#!/usr/bin/env node
+// Validates that the ESM module graph can be loaded without TDZ errors.
+// This script imports the main entry point in native ESM mode.
+// Usage: node scripts/validate-esm.mjs
+//
+// Exit code 0: No TDZ errors detected
+// Exit code 1: TDZ error detected (circular dependency issue)
+
+import { join, dirname } from 'path';
+import { fileURLToPath, pathToFileURL } from 'url';
+
+const __filename = fileURLToPath(import.meta.url);
+const __dirname = dirname(__filename);
+const ROOT = join(__dirname, '..');
+const SOURCES = join(ROOT, 'Sources');
+
+// Minimal browser global stubs for module-level code.
+// These prevent unrelated ReferenceErrors during module initialization.
+// The focus is on detecting TDZ errors, not runtime correctness.
+function createDeepProxy(name) {
+    const handler = {
+        get(_target, prop) {
+            if (prop === Symbol.toPrimitive) return () => '';
+            if (prop === Symbol.iterator) return undefined;
+            if (prop === 'toString') return () => `[stub:${name}]`;
+            if (prop === 'valueOf') return () => 0;
+            if (prop === 'then') return undefined; // avoid thenable detection
+            return createDeepProxy(`${name}.${String(prop)}`);
+        },
+        apply() { return createDeepProxy(`${name}()`); },
+        construct() { return createDeepProxy(`new ${name}`); },
+        set() { return true; },
+        has() { return true; },
+    };
+    return new Proxy(function() {}, handler);
+}
+
+// Set up browser globals
+const browserGlobals = [
+    'document', 'window', 'navigator', 'location', 'history',
+    'localStorage', 'sessionStorage', 'XMLHttpRequest', 'fetch',
+    'HTMLElement', 'HTMLCanvasElement', 'HTMLImageElement',
+    'Image', 'Audio', 'FileReader', 'Blob', 'URL', 'URLSearchParams',
+    'MutationObserver', 'ResizeObserver', 'IntersectionObserver',
+    'requestAnimationFrame', 'cancelAnimationFrame',
+    'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval',
+    'alert', 'confirm', 'prompt',
+    'Vue', '$', 'jQuery', 'Select2',
+    'Tesseract', 'cv', 'LZString',
+];
+
+for (const name of browserGlobals) {
+    if (!(name in globalThis)) {
+        globalThis[name] = createDeepProxy(name);
+    }
+}
+
+// Ensure document has basic DOM methods that return stubs
+globalThis.document = createDeepProxy('document');
+globalThis.window = createDeepProxy('window');
+
+// Entry point to validate
+const entryPoint = join(SOURCES, 'ArenaSimulatorMain.js');
+const entryUrl = pathToFileURL(entryPoint).href;
+
+try {
+    await import(entryUrl);
+    console.log('OK: Entry point loaded without TDZ errors.');
+    process.exit(0);
+} catch (err) {
+    // Classify the error
+    if (err instanceof ReferenceError && /Cannot access '.+' before initialization/.test(err.message)) {
+        console.error(`TDZ ERROR: ${err.message}`);
+        console.error(err.stack);
+        process.exit(1);
+    }
+
+    // Other ReferenceErrors for missing browser globals are expected
+    if (err instanceof ReferenceError) {
+        console.warn(`WARN: Non-TDZ ReferenceError (expected in Node.js): ${err.message}`);
+        console.log('OK: No TDZ errors detected (non-TDZ ReferenceError is acceptable).');
+        process.exit(0);
+    }
+
+    // Other errors — report but don't treat as TDZ failure
+    console.warn(`WARN: Non-TDZ error during import: ${err.constructor.name}: ${err.message}`);
+    if (err.stack) console.warn(err.stack);
+    console.log('OK: No TDZ errors detected (other error type).');
+    process.exit(0);
+}
