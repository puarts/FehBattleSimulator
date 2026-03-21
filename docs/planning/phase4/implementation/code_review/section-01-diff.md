diff --git a/docs/planning/phase4/circular-deps-baseline.md b/docs/planning/phase4/circular-deps-baseline.md
new file mode 100644
index 00000000..df3c4ed9
--- /dev/null
+++ b/docs/planning/phase4/circular-deps-baseline.md
@@ -0,0 +1,45 @@
+# 循環依存ベースライン
+
+## 取得日
+2026-03-21
+
+## コマンド
+```
+npx madge --circular Sources/
+```
+
+## 結果
+```
+Processed 67 files (1.7s)
+✔ No circular dependency found!
+```
+
+## 分析
+
+madge は **現在のimport文** に基づいて依存グラフを構築する。Phase 2 で追加されたimport文は不完全であり（741件の不足importが存在）、本来存在する循環パスが検出されていない。
+
+### 既知の循環パス（import追加後に顕在化する予定）
+
+```
+Logger.js -> Utilities.js -> Unit.js -> Skill.js -> SkillEffect.js -> SkillEffectCore.js -> Logger.js
+```
+
+### 既知の双方向参照（6組）
+
+| File A | File B |
+|--------|--------|
+| Skill.js | SkillEffect.js |
+| Skill.js | Unit.js |
+| Unit.js | SkillEffect.js |
+| Unit.js | SkillEffectHooks.js |
+| SkillEffect.js | SkillEffectBattleContext.js |
+| SkillEffectCore.js | CustomSkill.js |
+
+これらの循環は、セクション2-6でimportを正しく追加する前に構造的に解消する。
+
+## テストベースライン
+
+- テスト総数: 500
+- パス: 499
+- 失敗: 1（DamageCalculator_HeroBattleTest — タイムアウト。既知のflaky test）
+- ESLint: パス
diff --git a/package.json b/package.json
index a4bc6c16..817db88e 100644
--- a/package.json
+++ b/package.json
@@ -9,7 +9,8 @@
     "test:watch": "vitest",
     "build": "vite build",
     "dev": "vite",
-    "preview": "vite preview"
+    "preview": "vite preview",
+    "lint:deps": "madge --circular Sources/"
   },
   "repository": {
     "type": "git",
@@ -29,6 +30,7 @@
     "@vitejs/plugin-vue": "^6.0.5",
     "eslint": "^8.57.0",
     "jsdom": "^29.0.1",
+    "madge": "^8.0.0",
     "vite": "^8.0.1",
     "vitest": "^4.1.0"
   },
