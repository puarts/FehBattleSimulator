diff --git a/Sources/AetherRaidSimulator.html b/Sources/AetherRaidSimulator.html
index 658d47fd..4355233b 100644
--- a/Sources/AetherRaidSimulator.html
+++ b/Sources/AetherRaidSimulator.html
@@ -1377,9 +1377,6 @@
         onload="this.media='all'">
     <script async src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js"></script>
 
-    <!-- sortable.js -->
-    <script async src="https://cdn.jsdelivr.net/npm/sortablejs@1.8.4/Sortable.min.js"></script>
-
     <!-- クッキー(実際は使ってないので消してもいいかも) -->
     <!-- <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.js"></script> -->
 
diff --git a/Sources/ArenaSimulator.html b/Sources/ArenaSimulator.html
index eb6afa0f..21aba209 100644
--- a/Sources/ArenaSimulator.html
+++ b/Sources/ArenaSimulator.html
@@ -1351,9 +1351,6 @@
         onload="this.media='all'">
     <script async src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js"></script>
 
-    <!-- sortable.js -->
-    <script async src="https://cdn.jsdelivr.net/npm/sortablejs@1.8.4/Sortable.min.js"></script>
-
     <!-- クッキー(実際は使ってないので消してもいいかも) -->
     <!-- <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.js"></script> -->
 
diff --git a/Sources/SummonerDuelsSimulator.html b/Sources/SummonerDuelsSimulator.html
index cf11109d..5e146612 100644
--- a/Sources/SummonerDuelsSimulator.html
+++ b/Sources/SummonerDuelsSimulator.html
@@ -1443,9 +1443,6 @@
         onload="this.media='all'">
     <script async src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js"></script>
 
-    <!-- sortable.js -->
-    <script async src="https://cdn.jsdelivr.net/npm/sortablejs@1.8.4/Sortable.min.js"></script>
-
     <!-- クッキー(実際は使ってないので消してもいいかも) -->
     <!-- <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.js"></script> -->
 
diff --git a/Sources/UnitBuilder.html b/Sources/UnitBuilder.html
index 8c96af5c..e54ebbd5 100644
--- a/Sources/UnitBuilder.html
+++ b/Sources/UnitBuilder.html
@@ -1172,9 +1172,6 @@
         onload="this.media='all'">
     <script async src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js"></script> -->
 
-    <!-- sortable.js -->
-    <script async src="https://cdn.jsdelivr.net/npm/sortablejs@1.8.4/Sortable.min.js"></script>
-
     <!-- クッキー(実際は使ってないので消してもいいかも) -->
     <!-- <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.js"></script> -->
 
diff --git a/Sources/VueComponents.js b/Sources/VueComponents.js
index 774da39e..c45d14a4 100644
--- a/Sources/VueComponents.js
+++ b/Sources/VueComponents.js
@@ -3,6 +3,7 @@
 
 import { mapState, mapActions } from 'pinia';
 import { useMainStore } from './store.js';
+import Sortable from 'sortablejs';
 
 function initVueComponents(app) {
     app.component('battle-map', {
@@ -902,6 +903,31 @@ function initVueComponents(app) {
         },
     });
 
+    // SortableJS を使った Vue 3 draggable ラッパーコンポーネント
+    app.component('draggable', {
+        template: '<component :is="tag" ref="container"><slot></slot></component>',
+        props: {
+            tag: {
+                type: String,
+                default: 'div',
+            },
+        },
+        emits: ['end'],
+        mounted() {
+            this.sortableInstance = Sortable.create(this.$refs.container, {
+                animation: 150,
+                onEnd: (evt) => {
+                    this.$emit('end', evt);
+                },
+            });
+        },
+        beforeUnmount() {
+            if (this.sortableInstance) {
+                this.sortableInstance.destroy();
+            }
+        },
+    });
+
     app.component('FlashMessage', {
         name: 'FlashMessage',
         props: [
diff --git a/Tests/DraggableReplacement.test.js b/Tests/DraggableReplacement.test.js
new file mode 100644
index 00000000..f771b4bb
--- /dev/null
+++ b/Tests/DraggableReplacement.test.js
@@ -0,0 +1,81 @@
+import { describe, it, expect } from 'vitest';
+import { readFileSync } from 'fs';
+import { resolve } from 'path';
+
+const vueComponentsPath = resolve(__dirname, '../Sources/VueComponents.js');
+const vueComponentsSource = readFileSync(vueComponentsPath, 'utf-8');
+
+describe('Vue.Draggable Replacement', () => {
+    describe('CDN removal', () => {
+        const htmlFiles = [
+            'ArenaSimulator.html',
+            'AetherRaidSimulator.html',
+            'SummonerDuelsSimulator.html',
+            'UnitBuilder.html',
+        ];
+
+        for (const file of htmlFiles) {
+            it(`should not have SortableJS CDN script in ${file}`, () => {
+                const filePath = resolve(__dirname, '../Sources', file);
+                const content = readFileSync(filePath, 'utf-8');
+                expect(content).not.toMatch(/sortablejs@.*Sortable\.min\.js/);
+                expect(content).not.toMatch(/cdn\.jsdelivr\.net\/npm\/sortablejs/);
+            });
+        }
+
+        for (const file of htmlFiles) {
+            it(`should not have Vue.Draggable CDN script in ${file}`, () => {
+                const filePath = resolve(__dirname, '../Sources', file);
+                const content = readFileSync(filePath, 'utf-8');
+                expect(content).not.toMatch(/vuedraggable/);
+            });
+        }
+    });
+
+    describe('draggable component registration', () => {
+        it('should register draggable component via app.component()', () => {
+            expect(vueComponentsSource).toMatch(/app\.component\(\s*['"]draggable['"]/);
+        });
+
+        it('should import Sortable from sortablejs', () => {
+            expect(vueComponentsSource).toMatch(/import\s+.*Sortable.*from\s+['"]sortablejs['"]/);
+        });
+    });
+
+    describe('component implementation', () => {
+        // Extract the draggable component source
+        function extractComponentSource(name) {
+            const re = new RegExp(`app\\.component\\('${name}'`);
+            const match = vueComponentsSource.match(re);
+            if (!match) return '';
+            const start = match.index;
+            const rest = vueComponentsSource.substring(start + 1);
+            const nextMatch = rest.match(/app\.component\s*\(/);
+            const end = nextMatch ? start + 1 + nextMatch.index : vueComponentsSource.length;
+            return vueComponentsSource.substring(start, end);
+        }
+
+        const componentSource = extractComponentSource('draggable');
+
+        it('should accept a tag prop', () => {
+            expect(componentSource).toMatch(/tag\s*:\s*\{/);
+        });
+
+        it('should emit end event', () => {
+            expect(componentSource).toMatch(/emits\s*:\s*\[.*'end'/);
+        });
+
+        it('should use Sortable.create in mounted', () => {
+            expect(componentSource).toMatch(/Sortable\.create/);
+        });
+
+        it('should destroy sortable in beforeUnmount', () => {
+            expect(componentSource).toMatch(/beforeUnmount/);
+            expect(componentSource).toMatch(/destroy/);
+        });
+
+        it('should use dynamic tag via template', () => {
+            expect(componentSource).toMatch(/:is="tag"|:is='tag'/);
+        });
+    });
+});
diff --git a/Tests/VueComponentsMigration.test.js b/Tests/VueComponentsMigration.test.js
index 474d2729..b65a7554 100644
--- a/Tests/VueComponentsMigration.test.js
+++ b/Tests/VueComponentsMigration.test.js
@@ -24,11 +24,11 @@ describe('Vue 3 Component Migration - Static Analysis', () => {
         expect(matches).toBeNull();
     });
 
-    // 32 components registered via app.component() inside initVueComponents()
-    it('should use app.component() for all 32 registrations', () => {
+    // 33 components registered via app.component() inside initVueComponents()
+    it('should use app.component() for all 33 registrations', () => {
         const matches = vueComponentsSource.match(/app\.component\s*\(/g);
         expect(matches).not.toBeNull();
-        expect(matches.length).toBe(32);
+        expect(matches.length).toBe(33);
     });
 
     it('should not contain Vue 2 deprecated APIs', () => {
diff --git a/package-lock.json b/package-lock.json
index 53437f9a..a2742cdc 100644
--- a/package-lock.json
+++ b/package-lock.json
@@ -10,6 +10,7 @@
       "license": "MIT",
       "dependencies": {
         "pinia": "^3.0.4",
+        "sortablejs": "^1.15.7",
         "vue": "^3.5.30"
       },
       "devDependencies": {
@@ -5624,6 +5625,12 @@
         "node": ">=8"
       }
     },
+    "node_modules/sortablejs": {
+      "version": "1.15.7",
+      "resolved": "https://registry.npmjs.org/sortablejs/-/sortablejs-1.15.7.tgz",
+      "integrity": "sha512-Kk8wLQPlS+yi1ZEf48a4+fzHa4yxjC30M/Sr2AnQu+f/MPwvvX9XjZ6OWejiz8crBsLwSq8GHqaxaET7u6ux0A==",
+      "license": "MIT"
+    },
     "node_modules/source-map": {
       "version": "0.6.1",
       "resolved": "https://registry.npmjs.org/source-map/-/source-map-0.6.1.tgz",
@@ -10515,6 +10522,11 @@
       "integrity": "sha512-g9Q1haeby36OSStwb4ntCGGGaKsaVSjQ68fBxoQcutl5fS1vuY18H3wSt3jFyFtrkx+Kz0V1G85A4MyAdDMi2Q==",
       "dev": true
     },
+    "sortablejs": {
+      "version": "1.15.7",
+      "resolved": "https://registry.npmjs.org/sortablejs/-/sortablejs-1.15.7.tgz",
+      "integrity": "sha512-Kk8wLQPlS+yi1ZEf48a4+fzHa4yxjC30M/Sr2AnQu+f/MPwvvX9XjZ6OWejiz8crBsLwSq8GHqaxaET7u6ux0A=="
+    },
     "source-map": {
       "version": "0.6.1",
       "resolved": "https://registry.npmjs.org/source-map/-/source-map-0.6.1.tgz",
diff --git a/package.json b/package.json
index 10f04fae..f189db96 100644
--- a/package.json
+++ b/package.json
@@ -40,6 +40,7 @@
   },
   "dependencies": {
     "pinia": "^3.0.4",
+    "sortablejs": "^1.15.7",
     "vue": "^3.5.30"
   }
 }
