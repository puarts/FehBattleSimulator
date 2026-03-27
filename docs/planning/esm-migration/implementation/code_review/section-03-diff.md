diff --git a/Sources/.eslintrc.json b/Sources/.eslintrc.json
index abb387c1..fbc4df11 100644
--- a/Sources/.eslintrc.json
+++ b/Sources/.eslintrc.json
@@ -14,6 +14,12 @@
     "globals": {},
     "rules": {
         "no-unused-vars": 0,
-        "no-undef": 0
+        "no-undef": 0,
+        "strict": ["error", "safe"],
+        "no-octal": "error",
+        "no-octal-escape": "error",
+        "no-with": "error",
+        "no-delete-var": "error",
+        "no-implicit-globals": "error"
     }
 }
\ No newline at end of file
diff --git a/Tests/.eslintrc.json b/Tests/.eslintrc.json
index abc242d3..a087fc23 100644
--- a/Tests/.eslintrc.json
+++ b/Tests/.eslintrc.json
@@ -14,6 +14,12 @@
     "globals": {},
     "rules": {
         "no-unused-vars": 0,
-        "no-undef": 0
+        "no-undef": 0,
+        "strict": ["error", "safe"],
+        "no-octal": "error",
+        "no-octal-escape": "error",
+        "no-with": "error",
+        "no-delete-var": "error",
+        "no-implicit-globals": "error"
     }
 }
\ No newline at end of file
