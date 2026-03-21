diff --git a/Sources/Logger.js b/Sources/Logger.js
index 8fd153a8..92c10b2d 100644
--- a/Sources/Logger.js
+++ b/Sources/Logger.js
@@ -1,5 +1,3 @@
-import { ObjectUtil } from './Utilities.js';
-
 /**
  * @abstract
  */
@@ -20,7 +18,11 @@ class LoggerBase {
         ALL: 13
     });
 
-    static LOG_LEVEL_MAP = ObjectUtil.makeMapFromObj(this.LogLevel);
+    static get LOG_LEVEL_MAP() {
+        const map = new Map(Object.entries(this.LogLevel).map(([text, value]) => [value, text]));
+        Object.defineProperty(this, 'LOG_LEVEL_MAP', { value: map, writable: false, configurable: false });
+        return map;
+    }
 
     static levelStr(level) {
         return this.LOG_LEVEL_MAP.get(level);
diff --git a/Tests/LoggerLazyInit.test.js b/Tests/LoggerLazyInit.test.js
new file mode 100644
index 00000000..13f7c829
--- /dev/null
+++ b/Tests/LoggerLazyInit.test.js
@@ -0,0 +1,33 @@
+import { describe, test, expect } from 'vitest';
+import { LoggerBase, SimpleLogger } from '../Sources/Logger.js';
+
+describe('Logger lazy init', () => {
+    test('LOG_LEVEL_MAP returns correct Map with value->name mapping', () => {
+        const map = LoggerBase.LOG_LEVEL_MAP;
+        expect(map).toBeInstanceOf(Map);
+        expect(map.get(1)).toBe('OFF');
+        expect(map.get(2)).toBe('FATAL');
+        expect(map.get(3)).toBe('ERROR');
+        expect(map.get(7)).toBe('DEBUG');
+        expect(map.get(13)).toBe('ALL');
+    });
+
+    test('LOG_LEVEL_MAP returns same instance on multiple accesses (cached)', () => {
+        const map1 = LoggerBase.LOG_LEVEL_MAP;
+        const map2 = LoggerBase.LOG_LEVEL_MAP;
+        expect(map1).toBe(map2);
+    });
+
+    test('levelStr works correctly', () => {
+        expect(LoggerBase.levelStr(1)).toBe('OFF');
+        expect(LoggerBase.levelStr(13)).toBe('ALL');
+    });
+
+    test('SimpleLogger writeLog works after lazy init change', () => {
+        const logger = new SimpleLogger();
+        logger.isLogEnabled = true;
+        logger._logLevel = LoggerBase.LogLevel.ALL;
+        logger.writeLog('test message');
+        expect(logger.log).toContain('test message');
+    });
+});
