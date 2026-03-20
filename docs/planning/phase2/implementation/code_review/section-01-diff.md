diff --git a/Tests/BuildFilter.test.js b/Tests/BuildFilter.test.js
new file mode 100644
index 00000000..735d705e
--- /dev/null
+++ b/Tests/BuildFilter.test.js
@@ -0,0 +1,53 @@
+describe('Build filter', () => {
+    // build.mjs の filterImportExport と同じロジック
+    function filterImportExport(content) {
+        return content
+            .split('\n')
+            .filter(line => !(/^import /.test(line) || /^export \{/.test(line)))
+            .join('\n');
+    }
+
+    test('import 行を除去する', () => {
+        const input = [
+            "import { Foo } from './Bar.js';",
+            "import { Weapon, Support } from './SkillConstants.js';",
+            "const x = 1;",
+        ].join('\n');
+        const result = filterImportExport(input);
+        expect(result).toBe("const x = 1;");
+    });
+
+    test('export { ... } 行を除去する', () => {
+        const input = [
+            "const x = 1;",
+            "export { Foo, Bar };",
+            "export { Baz };",
+        ].join('\n');
+        const result = filterImportExport(input);
+        expect(result).toBe("const x = 1;");
+    });
+
+    test('通常のコード行を除去しない', () => {
+        const lines = [
+            "// import something",
+            "const s = 'import { X } from ...';",
+            "console.log('export { ... }');",
+            "  import { indented } from './Foo.js';",
+        ];
+        const input = lines.join('\n');
+        const result = filterImportExport(input);
+        expect(result).toBe(input);
+    });
+
+    test('フィルタ適用前後で import/export 以外の行数が変わらない', () => {
+        const normalLines = [
+            "const a = 1;",
+            "function foo() {}",
+            "class Bar {}",
+            "// comment",
+        ];
+        const input = normalLines.join('\n');
+        const result = filterImportExport(input);
+        expect(result.split('\n').length).toBe(normalLines.length);
+    });
+});
diff --git a/create_tests.sh b/create_tests.sh
index 60f277cb..92aa2269 100755
--- a/create_tests.sh
+++ b/create_tests.sh
@@ -66,6 +66,7 @@ TEST_FILE_NAMES=(
     Performance
     TestHelper
     SmokeTest
+    BuildFilter
     )
 
 # カテゴリに応じたテストファイル選択
@@ -94,7 +95,7 @@ touch ./$TARGET_FILE
 cp /dev/null ./$TARGET_FILE
 
 for name in ${SOURCE_FILE_NAMES[@]}; do
-    cat ./Sources/${name}.js >> ./$TARGET_FILE
+    grep -v -E '^import |^export \{' ./Sources/${name}.js >> ./$TARGET_FILE
 done
 
 for name in ${TEST_UTIL_FILE_NAMES[@]}; do
diff --git a/scripts/build.mjs b/scripts/build.mjs
index 623370fd..611e0b5d 100644
--- a/scripts/build.mjs
+++ b/scripts/build.mjs
@@ -109,6 +109,13 @@ const BUILDS = {
 // ビルド実行
 // ---------------------------------------------------------------------------
 
+function filterImportExport(content) {
+    return content
+        .split('\n')
+        .filter(line => !(/^import /.test(line) || /^export \{/.test(line)))
+        .join('\n');
+}
+
 function mergeFiles(fileNames) {
     const parts = [];
     for (const name of fileNames) {
@@ -117,7 +124,7 @@ function mergeFiles(fileNames) {
             console.warn(`WARNING: ${filePath} was not found`);
             continue;
         }
-        parts.push(readFileSync(filePath, 'utf-8'));
+        parts.push(filterImportExport(readFileSync(filePath, 'utf-8')));
     }
     // Deploy.bat (type コマンド) と同じく、ファイル内容をそのまま連結
     return parts.join('');
