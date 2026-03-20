diff --git a/.env.development b/.env.development
new file mode 100644
index 00000000..2e754302
--- /dev/null
+++ b/.env.development
@@ -0,0 +1 @@
+VITE_DATA_SOURCE=local
diff --git a/.env.production b/.env.production
new file mode 100644
index 00000000..0a67a157
--- /dev/null
+++ b/.env.production
@@ -0,0 +1 @@
+VITE_DATA_SOURCE=remote
diff --git a/.gitignore b/.gitignore
index 07b05e5e..a81da79f 100644
--- a/.gitignore
+++ b/.gitignore
@@ -9,6 +9,9 @@ coverage/
 # Samples (local scratch files)
 Sources/samples/
 
+# Environment overrides (user-local)
+.env*.local
+
 # Build artifacts
 Outputs/
 dist/
diff --git a/Tests/DevServerEnv.test.js b/Tests/DevServerEnv.test.js
new file mode 100644
index 00000000..b2795f32
--- /dev/null
+++ b/Tests/DevServerEnv.test.js
@@ -0,0 +1,21 @@
+import { describe, it, expect } from 'vitest';
+import fs from 'fs';
+import path from 'path';
+
+const ROOT = path.resolve(__dirname, '..');
+
+describe('.env files', () => {
+    it('.env.development が存在し VITE_DATA_SOURCE=local を定義していること', () => {
+        const envPath = path.join(ROOT, '.env.development');
+        expect(fs.existsSync(envPath)).toBe(true);
+        const content = fs.readFileSync(envPath, 'utf-8');
+        expect(content).toContain('VITE_DATA_SOURCE=local');
+    });
+
+    it('.env.production が存在し VITE_DATA_SOURCE=remote を定義していること', () => {
+        const envPath = path.join(ROOT, '.env.production');
+        expect(fs.existsSync(envPath)).toBe(true);
+        const content = fs.readFileSync(envPath, 'utf-8');
+        expect(content).toContain('VITE_DATA_SOURCE=remote');
+    });
+});
diff --git a/Tests/DevServerHtml.test.js b/Tests/DevServerHtml.test.js
new file mode 100644
index 00000000..0ac572d8
--- /dev/null
+++ b/Tests/DevServerHtml.test.js
@@ -0,0 +1,62 @@
+import { describe, it, expect } from 'vitest';
+import fs from 'fs';
+import path from 'path';
+import { glob } from 'glob';
+
+const SOURCES = path.resolve(__dirname, '..', 'Sources');
+
+const HTML_FILES = [
+    'AetherRaidSimulator.html',
+    'ArenaSimulator.html',
+    'SummonerDuelsSimulator.html',
+    'UnitBuilder.html',
+    'StatusCalculator.html',
+    'DamageCalculator.html',
+    'HeroIconLister.html',
+    'HeroStatusClusterer.html',
+];
+
+const ENTRY_POINTS = {
+    'AetherRaidSimulator.html': 'AetherRaidSimulatorMain.js',
+    'ArenaSimulator.html': 'ArenaSimulatorMain.js',
+    'SummonerDuelsSimulator.html': 'SummonerDuelsSimulatorMain.js',
+    'UnitBuilder.html': 'UnitBuilderMain.js',
+    'StatusCalculator.html': 'StatusCalcMain.js',
+    'DamageCalculator.html': 'DamageCalculatorMain.js',
+    'HeroIconLister.html': 'HeroIconListerMain.js',
+    'HeroStatusClusterer.html': 'HeroStatusClustererMain.js',
+};
+
+describe('HTML files cleanup', () => {
+    for (const htmlFile of HTML_FILES) {
+        describe(htmlFile, () => {
+            let content;
+
+            beforeAll(() => {
+                content = fs.readFileSync(path.join(SOURCES, htmlFile), 'utf-8');
+            });
+
+            it('loadScripts 関数が残っていないこと', () => {
+                expect(content).not.toMatch(/function\s+loadScripts/);
+            });
+
+            it('createScriptElement 関数が残っていないこと', () => {
+                expect(content).not.toMatch(/function\s+createScriptElement/);
+            });
+
+            it('SKILL_EFFECT_FILES / SKILL_IMPL_FILES の参照が残っていないこと', () => {
+                expect(content).not.toContain('SKILL_EFFECT_FILES');
+                expect(content).not.toContain('SKILL_IMPL_FILES');
+            });
+
+            it('Local.js の script タグが残っていないこと', () => {
+                expect(content).not.toMatch(/<script[^>]*src=["'].*Local\.js["']/);
+            });
+
+            it(`<script type="module" src="./${ENTRY_POINTS[htmlFile]}"> が存在すること`, () => {
+                const entryPoint = ENTRY_POINTS[htmlFile];
+                expect(content).toContain(`<script type="module" src="./${entryPoint}">`);
+            });
+        });
+    }
+});
diff --git a/vite.config.js b/vite.config.js
index fb2a8deb..cd5db6c4 100644
--- a/vite.config.js
+++ b/vite.config.js
@@ -16,6 +16,9 @@ export default defineConfig({
         pool: 'threads',
         singleThread: true,
     },
+    server: {
+        cors: true,
+    },
     build: {
         outDir: '../dist',
         emptyOutDir: true,
