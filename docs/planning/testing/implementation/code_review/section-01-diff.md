diff --git a/.gitignore b/.gitignore
index 2599ef72..fbe49390 100644
--- a/.gitignore
+++ b/.gitignore
@@ -4,6 +4,7 @@ vendor/
 
 # Generated files
 All.test.js
+coverage/
 
 # Samples (local scratch files)
 Sources/samples/
diff --git a/Tests/CombatFlow.test.js b/Tests/CombatFlow.test.js
new file mode 100644
index 00000000..53831b9c
--- /dev/null
+++ b/Tests/CombatFlow.test.js
@@ -0,0 +1,4 @@
+describe('Combat Flow Tests', () => {
+    // テストはsection-07で追加
+    test('placeholder', () => {});
+});
diff --git a/Tests/DamageReduction.test.js b/Tests/DamageReduction.test.js
new file mode 100644
index 00000000..853f5572
--- /dev/null
+++ b/Tests/DamageReduction.test.js
@@ -0,0 +1,4 @@
+describe('Damage Reduction Tests', () => {
+    // テストはsection-07で追加
+    test('placeholder', () => {});
+});
diff --git a/Tests/DslNode.test.js b/Tests/DslNode.test.js
new file mode 100644
index 00000000..13d4439b
--- /dev/null
+++ b/Tests/DslNode.test.js
@@ -0,0 +1,4 @@
+describe('DSL Node Tests', () => {
+    // テストはsection-08で追加
+    test('placeholder', () => {});
+});
diff --git a/Tests/FollowUpAttack.test.js b/Tests/FollowUpAttack.test.js
new file mode 100644
index 00000000..b0f93583
--- /dev/null
+++ b/Tests/FollowUpAttack.test.js
@@ -0,0 +1,4 @@
+describe('Follow-Up Attack Tests', () => {
+    // テストはsection-07で追加
+    test('placeholder', () => {});
+});
diff --git a/Tests/Performance.test.js b/Tests/Performance.test.js
new file mode 100644
index 00000000..9746c3f7
--- /dev/null
+++ b/Tests/Performance.test.js
@@ -0,0 +1,4 @@
+describe('Performance Benchmarks', () => {
+    // テストはsection-04で追加
+    test('placeholder', () => {});
+});
diff --git a/Tests/SkillRegression.test.js b/Tests/SkillRegression.test.js
new file mode 100644
index 00000000..0e786dd2
--- /dev/null
+++ b/Tests/SkillRegression.test.js
@@ -0,0 +1,4 @@
+describe('Skill Regression Tests', () => {
+    // テストはsection-05, section-06で追加
+    test('placeholder', () => {});
+});
diff --git a/Tests/SpecialCount.test.js b/Tests/SpecialCount.test.js
new file mode 100644
index 00000000..d2a07625
--- /dev/null
+++ b/Tests/SpecialCount.test.js
@@ -0,0 +1,4 @@
+describe('Special Count Tests', () => {
+    // テストはsection-07で追加
+    test('placeholder', () => {});
+});
diff --git a/Tests/StatusEffect.test.js b/Tests/StatusEffect.test.js
new file mode 100644
index 00000000..42137d6b
--- /dev/null
+++ b/Tests/StatusEffect.test.js
@@ -0,0 +1,4 @@
+describe('Status Effect Tests', () => {
+    // テストはsection-07で追加
+    test('placeholder', () => {});
+});
diff --git a/Tests/TestHelper.test.js b/Tests/TestHelper.test.js
new file mode 100644
index 00000000..525fe784
--- /dev/null
+++ b/Tests/TestHelper.test.js
@@ -0,0 +1,4 @@
+describe('Test Helper Tests', () => {
+    // テストはsection-02で追加
+    test('placeholder', () => {});
+});
diff --git a/create_tests.sh b/create_tests.sh
index d1a7156c..478f2531 100755
--- a/create_tests.sh
+++ b/create_tests.sh
@@ -48,14 +48,46 @@ TEST_UTIL_FILE_NAMES=(
     TestGlobals
     )
 TEST_FILE_NAMES=(
+    # 既存
     DamageCalculator
     UnitManager
     BeginningOfTurnSkillHandler
     SkillEffect
     GetRequirements
     SimpleUtility
+    # 新規
+    SkillRegression
+    CombatFlow
+    SpecialCount
+    DamageReduction
+    FollowUpAttack
+    StatusEffect
+    DslNode
+    Performance
+    TestHelper
     )
 
+# カテゴリに応じたテストファイル選択
+case "$1" in
+  skill)
+    SELECTED_TEST_FILES=(SkillRegression)
+    ;;
+  combat)
+    SELECTED_TEST_FILES=(DamageCalculator BeginningOfTurnSkillHandler
+                         CombatFlow SpecialCount DamageReduction
+                         FollowUpAttack StatusEffect)
+    ;;
+  dsl)
+    SELECTED_TEST_FILES=(SkillEffect GetRequirements DslNode)
+    ;;
+  infra)
+    SELECTED_TEST_FILES=(UnitManager SimpleUtility Performance TestHelper)
+    ;;
+  *)
+    SELECTED_TEST_FILES=("${TEST_FILE_NAMES[@]}")
+    ;;
+esac
+
 TARGET_FILE=All.test.js
 touch ./$TARGET_FILE
 cp /dev/null ./$TARGET_FILE
@@ -68,6 +100,6 @@ for name in ${TEST_UTIL_FILE_NAMES[@]}; do
     cat ./Tests/${name}.js >> ./$TARGET_FILE
 done
 
-for name in ${TEST_FILE_NAMES[@]}; do
+for name in ${SELECTED_TEST_FILES[@]}; do
     cat ./Tests/${name}.test.js >> ./$TARGET_FILE
 done
diff --git a/run_tests.sh b/run_tests.sh
index 4d7aea54..49d5d1e6 100755
--- a/run_tests.sh
+++ b/run_tests.sh
@@ -1,16 +1,27 @@
 #!/usr/bin/env bash
 
-./create_tests.sh
+CATEGORIES="skill combat dsl infra"
+CATEGORY=""
+
+# 第1引数がカテゴリ名かチェック
+for cat in $CATEGORIES; do
+  if [ "$1" = "$cat" ]; then
+    CATEGORY="$1"
+    shift  # カテゴリ引数を消費
+    break
+  fi
+done
+
+# create_tests.sh にカテゴリを渡す
+./create_tests.sh $CATEGORY
 
 TARGET_FILE=All.test.js
 
-# 引数の数($#)が0より大きいかチェック
-if [ $# -gt 0 ]; then
-  # 引数がある場合: test:only に引数をそのまま渡す
-  # "$@" を使うことで、スペースを含む引数(例: -t "closest")も正しく渡されます
+if [ -n "$CATEGORY" ] || [ $# -gt 0 ]; then
+  # カテゴリ指定時またはJest引数ありの場合: ESLintスキップ
   npm run test:only -- "$@"
 else
-  # 引数がない場合: 従来の npm test (jest + eslint) を実行
+  # 引数なし: 従来の npm test (jest + eslint)
   npm test
 fi
 
