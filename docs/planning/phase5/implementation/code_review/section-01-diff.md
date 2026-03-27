diff --git a/Tests/legacy/filterImportExport.js b/Tests/legacy/filterImportExport.js
new file mode 100644
index 00000000..9b9fcb1f
--- /dev/null
+++ b/Tests/legacy/filterImportExport.js
@@ -0,0 +1,42 @@
+/**
+ * filterImportExport - ESM import/export 文ストリップ関数
+ *
+ * 旧 vitest.setup.js の連結方式で使用されていた変換関数。
+ * Phase 5 Section 01 で連結廃止の前準備としてここに退避された。
+ *
+ * JSソースコードの文字列から import/export 文を除去し、
+ * 連結実行（vm.runInThisContext）可能な形式に変換する。
+ *
+ * - 単行 import 文を完全にスキップ
+ * - 複数行 import 文を検出し、閉じるまでスキップ
+ * - `export { ... }` 行をスキップ
+ * - `export function/class/const/let/var` の `export` キーワードのみ除去
+ */
+export function filterImportExport(content) {
+    const lines = content.split('\n');
+    const result = [];
+    let inMultiLineImport = false;
+    for (const line of lines) {
+        if (inMultiLineImport) {
+            // Skip lines until we find the closing of the import statement
+            if (/\bfrom\s+['"]/.test(line) || /^}\s*from\s+['"]/.test(line)) {
+                inMultiLineImport = false;
+            }
+            continue;
+        }
+        if (/^import /.test(line)) {
+            // Check if this is a complete single-line import
+            if (/from\s+['"]/.test(line) || /^import\s+['"]/.test(line)) {
+                continue; // single-line import, skip it
+            }
+            // Multi-line import starts here
+            inMultiLineImport = true;
+            continue;
+        }
+        if (/^export \{/.test(line)) {
+            continue;
+        }
+        result.push(line.replace(/^export (function|class|const|let|var) /, '$1 '));
+    }
+    return result.join('\n');
+}
diff --git a/Tests/legacy/filterImportExport.test.js b/Tests/legacy/filterImportExport.test.js
new file mode 100644
index 00000000..5cf3f8f5
--- /dev/null
+++ b/Tests/legacy/filterImportExport.test.js
@@ -0,0 +1,89 @@
+import { describe, test, expect } from 'vitest';
+import { filterImportExport } from './filterImportExport.js';
+import fs from 'node:fs';
+import path from 'node:path';
+
+describe('filterImportExport', () => {
+    test('単行 import 文を除去する', () => {
+        const input = [
+            "import { Foo } from './Foo.js';",
+            "const x = 1;",
+            "import Bar from 'bar';",
+        ].join('\n');
+        const result = filterImportExport(input);
+        expect(result).not.toContain('import');
+        expect(result).toContain('const x = 1;');
+    });
+
+    test('副作用のみの import 文を除去する', () => {
+        const input = [
+            "import './setup.js';",
+            "const x = 1;",
+        ].join('\n');
+        const result = filterImportExport(input);
+        expect(result).not.toContain('import');
+        expect(result).toContain('const x = 1;');
+    });
+
+    test('複数行 import 文を除去する', () => {
+        const input = [
+            "import {",
+            "    Foo,",
+            "    Bar,",
+            "} from './module.js';",
+            "const y = 2;",
+        ].join('\n');
+        const result = filterImportExport(input);
+        expect(result).not.toContain('import');
+        expect(result).not.toContain('Foo');
+        expect(result).not.toContain('Bar');
+        expect(result).toContain('const y = 2;');
+    });
+
+    test('export { } 行を除去する', () => {
+        const input = [
+            "const a = 1;",
+            "export { a, b, c };",
+            "const d = 4;",
+        ].join('\n');
+        const result = filterImportExport(input);
+        expect(result).not.toContain('export');
+        expect(result).toContain('const a = 1;');
+        expect(result).toContain('const d = 4;');
+    });
+
+    test('export キーワードのみ除去し宣言は残す', () => {
+        const input = [
+            "export function foo() {}",
+            "export class Bar {}",
+            "export const X = 1;",
+            "export let Y = 2;",
+            "export var Z = 3;",
+        ].join('\n');
+        const result = filterImportExport(input);
+        expect(result).not.toContain('export');
+        expect(result).toContain('function foo() {}');
+        expect(result).toContain('class Bar {}');
+        expect(result).toContain('const X = 1;');
+        expect(result).toContain('let Y = 2;');
+        expect(result).toContain('var Z = 3;');
+    });
+
+    test('通常のコード行は変更しない', () => {
+        const input = [
+            "const a = 1;",
+            "function hello() { return 'world'; }",
+            "// a comment",
+            "",
+        ].join('\n');
+        const result = filterImportExport(input);
+        expect(result).toBe(input);
+    });
+
+    test('Sources/ ディレクトリに filterImportExport 関連ファイルがない', () => {
+        const sourcesDir = path.resolve(import.meta.dirname, '../../Sources');
+        const files = fs.readdirSync(sourcesDir);
+        const matches = files.filter(f => /filterImportExport/i.test(f));
+        expect(matches).toEqual([]);
+    });
+});
