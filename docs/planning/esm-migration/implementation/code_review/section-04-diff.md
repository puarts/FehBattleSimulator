diff --git a/docs/planning/esm-migration/directory-design.md b/docs/planning/esm-migration/directory-design.md
new file mode 100644
index 00000000..1cb9c8fc
--- /dev/null
+++ b/docs/planning/esm-migration/directory-design.md
@@ -0,0 +1,380 @@
+# ESM移行 — ディレクトリ構成設計書
+
+> section-02の依存グラフ分析結果に基づく確定版
+
+## 概要
+
+Sources/配下の64個のJSファイルを機能ドメイン別の10ディレクトリに再配置する。JSコードの内容は一切変更しない（パス更新のみ）。
+
+### 重要な前提
+
+依存グラフ分析（section-02）の結果、64ファイル中39ファイルが1つの巨大SCC（強連結成分）を形成している。これはグローバルスコープでの暗黙的依存が推移的に絡み合っている実態を反映する。したがって、ディレクトリ境界は**依存方向の強制**ではなく**機能ドメインによる整理**として機能する。循環依存の解消はESM化フェーズ（Phase 3以降）で行う。
+
+---
+
+## 確定ディレクトリ構成
+
+```
+Sources/
+├── core/                    # 基盤・ユーティリティ
+│   ├── GlobalDefinitions.js        [Layer 0, global-constant]
+│   ├── GlobalDefinitions_Debug.js  [Layer 0, global-constant]
+│   ├── Utilities.js                [Layer 3/SCC, pure-definition]
+│   ├── Logger.js                   [Layer 0, pure-definition]
+│   └── KeyRepeatHandler.js         [Layer 0, pure-definition]
+│
+├── data/                    # データ定義・定数・列挙
+│   ├── SkillConstants.js           [Layer 1, initialization-root]
+│   ├── Skill.js                    [Layer 3/SCC, initialization-root]
+│   ├── HeroInfoConstants.js        [Layer 3/SCC, initialization-root]
+│   ├── HeroInfo.js                 [Layer 4, pure-definition]
+│   └── UnitConstants.js            [Layer 3/SCC, pure-definition]
+│
+├── map/                     # マップ・構造物・テーブル
+│   ├── BattleMapElement.js         [Layer 0, pure-definition]
+│   ├── Cell.js                     [Layer 0, pure-definition]
+│   ├── Tile.js                     [Layer 3/SCC, initialization-root]
+│   ├── Structures.js               [Layer 3/SCC, pure-definition]
+│   ├── BattleMap.js                [Layer 3/SCC, initialization-root]
+│   ├── BattleMapSettings.js        [Layer 3/SCC, pure-definition]
+│   └── Table.js                    [Layer 3/SCC, pure-definition]
+│
+├── unit/                    # ユニット・コンテキスト
+│   ├── BattleContext.js            [Layer 3/SCC, pure-definition]
+│   ├── Unit.js                     [Layer 3/SCC, pure-definition]
+│   ├── UnitManager.js              [Layer 3/SCC, pure-definition]
+│   ├── GlobalBattleContext.js      [Layer 3/SCC, pure-definition]
+│   └── TurnSetting.js             [Layer 1, pure-definition]
+│
+├── combat/                  # 戦闘計算
+│   ├── DamageCalculationUtility.js [Layer 3/SCC, initialization-root]
+│   ├── DamageCalculator.js         [Layer 3/SCC, pure-definition]
+│   ├── PostCombatSkillHander.js    [Layer 3/SCC, pure-definition]
+│   ├── DamageCalculatorWrapper.js  [Layer 3/SCC, pure-definition]
+│   └── BeginningOfTurnSkillHandler.js [Layer 3/SCC, pure-definition]
+│
+├── database/                # データベース・プリセット・サンプル
+│   ├── SkillDatabase.js            [Layer 2, pure-definition]
+│   ├── HeroDatabase.js             [Layer 0, pure-definition]
+│   ├── SampleSkillInfos.js         [Layer 4, pure-definition]
+│   ├── SampleHeroInfos.js          [Layer 5, pure-definition]
+│   └── AetherRaidDefensePresets.js [Layer 0, pure-definition]
+│
+├── skill-dsl/               # スキルDSL基盤
+│   ├── SkillEffectCore.js          [Layer 3/SCC, pure-definition]
+│   ├── SkillEffectEnv.js           [Layer 3/SCC, pure-definition]
+│   ├── SkillEffect.js              [Layer 3/SCC, pure-definition]
+│   ├── SkillEffectField.js         [Layer 3/SCC, pure-definition]
+│   ├── SkillEffectUnit.js          [Layer 3/SCC, pure-definition]
+│   ├── SkillEffectBattleContext.js  [Layer 3/SCC, pure-definition]
+│   ├── SkillEffectHooks.js         [Layer 3/SCC, pure-definition]
+│   ├── SkillEffectRegistrar.js     [Layer 4, pure-definition]
+│   └── SkillEffectAliases.js       [Layer 3/SCC, pure-definition]
+│
+├── skill-impl/              # スキル実装（変更頻度高、コンフリクトリスク高）
+│   ├── CustomSkill.js              [Layer 3/SCC, initialization-root]
+│   ├── SkillImpl.js                [Layer 5, initialization-root]
+│   ├── SkillImpl202408.js          [Layer 4, initialization-root]
+│   ├── SkillImpl202501.js          [Layer 5, initialization-root]
+│   └── SkillImpl202601.js          [Layer 5, initialization-root]
+│
+├── app/                     # アプリケーション・UI統合
+│   ├── SettingManager.js           [Layer 3/SCC, pure-definition]
+│   ├── AppData.js                  [Layer 3/SCC, global-assignment]
+│   ├── AudioManager.js             [Layer 3/SCC, pure-definition]
+│   ├── Main_ImageProcessing.js     [Layer 3/SCC, pure-definition]
+│   ├── Main_OriginalAi.js          [Layer 3/SCC, pure-definition]
+│   ├── Main_MouseAndTouch.js       [Layer 3/SCC, global-assignment]
+│   ├── BattleSimulatorBase.js      [Layer 3/SCC, global-assignment]
+│   └── VueComponents.js            [Layer 4, initialization-root]
+│
+├── pages/                   # ページ固有エントリポイント
+│   ├── AetherRaidSimulatorMain.js  [Layer 3/SCC, global-assignment]
+│   ├── ArenaSimulatorMain.js       [Layer 3/SCC, global-assignment]
+│   ├── SummonerDuelsSimulatorMain.js [Layer 3/SCC, global-assignment]
+│   ├── DamageCalculatorMain.js     [Layer 4, global-assignment]
+│   ├── StatusCalcMain.js           [Layer 3/SCC, global-mutable-state]
+│   ├── UnitBuilderMain.js          [Layer 3/SCC, global-assignment]
+│   ├── HeroIconListerMain.js       [Layer 1, global-mutable-state]
+│   └── HeroStatusClustererMain.js  [Layer 4, global-assignment]
+│
+├── Local.js                 # ローカル開発用（ルートに維持）
+├── TestUtilities.js         # テスト用（ルートに維持）
+│
+├── *.html                   # HTMLファイル（ルートに維持）
+└── samples/                 # 既存（変更なし）
+    └── tmp.js
+```
+
+### ファイル数確認
+
+| ディレクトリ | ファイル数 |
+|-------------|----------|
+| core/ | 5 |
+| data/ | 5 |
+| map/ | 7 |
+| unit/ | 5 |
+| combat/ | 5 |
+| database/ | 5 |
+| skill-dsl/ | 9 |
+| skill-impl/ | 5 |
+| app/ | 8 |
+| pages/ | 8 |
+| ルート | 2 |
+| **合計** | **64** |
+
+### 設計根拠とsection-02からの調整
+
+1. **Utilities.jsはcore/に維持**: Layer 3/SCCに属するが、機能的にはコアユーティリティ。依存方向としてはSkillConstants→Tile→UnitConstantsを参照するためSCCに引き込まれているが、配置はcore/が自然。
+
+2. **HeroIconListerMain.jsはpages/に配置**: Layer 1で多くのLayer 3ファイルから参照される特異なファイル。機能的にはページエントリだが、グローバル状態（g_heroIconBgColorDict等）を他ファイルが参照している。ESM化時にこのグローバル状態を別モジュールに分離する候補。
+
+3. **StatusCalcMain.jsはpages/に配置**: Layer 3/SCCに属するが、機能的にはページエントリ。DamageCalculator.jsやBattleSimulatorBase.jsから参照されているためSCCに巻き込まれている。
+
+4. **SkillEffectRegistrar.jsはskill-dsl/に維持**: Layer 4だが、機能的にはDSL基盤の一部。
+
+---
+
+## 移動バッチ計画
+
+依存レイヤーの低いファイルから順に移動する。各バッチ完了時に`./run_tests.sh`でテスト確認。
+
+### バッチ1: core/ — 基盤ユーティリティ（5ファイル）
+
+| ファイル | Layer | 副作用分類 |
+|---------|-------|-----------|
+| GlobalDefinitions.js | 0 | global-constant |
+| GlobalDefinitions_Debug.js | 0 | global-constant |
+| Logger.js | 0 | pure-definition |
+| KeyRepeatHandler.js | 0 | pure-definition |
+| Utilities.js | 3/SCC | pure-definition |
+
+**更新対象**: create_tests.sh, 全HTML (7本番+1ローカル), Deploy.bat
+
+### バッチ2: data/ — データ定義・定数（5ファイル）
+
+| ファイル | Layer | 副作用分類 |
+|---------|-------|-----------|
+| SkillConstants.js | 1 | initialization-root |
+| Skill.js | 3/SCC | initialization-root |
+| HeroInfoConstants.js | 3/SCC | initialization-root |
+| HeroInfo.js | 4 | pure-definition |
+| UnitConstants.js | 3/SCC | pure-definition |
+
+**更新対象**: create_tests.sh, 全HTML, Deploy.bat
+
+### バッチ3: map/ — マップ関連（7ファイル）
+
+| ファイル | Layer | 副作用分類 |
+|---------|-------|-----------|
+| BattleMapElement.js | 0 | pure-definition |
+| Cell.js | 0 | pure-definition |
+| Tile.js | 3/SCC | initialization-root |
+| Structures.js | 3/SCC | pure-definition |
+| BattleMap.js | 3/SCC | initialization-root |
+| BattleMapSettings.js | 3/SCC | pure-definition |
+| Table.js | 3/SCC | pure-definition |
+
+**更新対象**: create_tests.sh, 全HTML, Deploy.bat
+
+### バッチ4: unit/ — ユニット・コンテキスト（5ファイル）
+
+| ファイル | Layer | 副作用分類 |
+|---------|-------|-----------|
+| BattleContext.js | 3/SCC | pure-definition |
+| Unit.js | 3/SCC | pure-definition |
+| UnitManager.js | 3/SCC | pure-definition |
+| GlobalBattleContext.js | 3/SCC | pure-definition |
+| TurnSetting.js | 1 | pure-definition |
+
+**更新対象**: create_tests.sh, 全HTML, Deploy.bat
+
+### バッチ5: combat/ — 戦闘計算（5ファイル）
+
+| ファイル | Layer | 副作用分類 |
+|---------|-------|-----------|
+| DamageCalculationUtility.js | 3/SCC | initialization-root |
+| DamageCalculator.js | 3/SCC | pure-definition |
+| PostCombatSkillHander.js | 3/SCC | pure-definition |
+| DamageCalculatorWrapper.js | 3/SCC | pure-definition |
+| BeginningOfTurnSkillHandler.js | 3/SCC | pure-definition |
+
+**更新対象**: create_tests.sh, 全HTML, Deploy.bat
+
+### バッチ6: database/ — データベース・プリセット（5ファイル）
+
+| ファイル | Layer | 副作用分類 |
+|---------|-------|-----------|
+| SkillDatabase.js | 2 | pure-definition |
+| HeroDatabase.js | 0 | pure-definition |
+| SampleSkillInfos.js | 4 | pure-definition |
+| SampleHeroInfos.js | 5 | pure-definition |
+| AetherRaidDefensePresets.js | 0 | pure-definition |
+
+**更新対象**: create_tests.sh, 全HTML, Deploy.bat
+
+### バッチ7: skill-dsl/ — スキルDSL基盤（9ファイル）
+
+| ファイル | Layer | 副作用分類 |
+|---------|-------|-----------|
+| SkillEffectCore.js | 3/SCC | pure-definition |
+| SkillEffectEnv.js | 3/SCC | pure-definition |
+| SkillEffect.js | 3/SCC | pure-definition |
+| SkillEffectField.js | 3/SCC | pure-definition |
+| SkillEffectUnit.js | 3/SCC | pure-definition |
+| SkillEffectBattleContext.js | 3/SCC | pure-definition |
+| SkillEffectHooks.js | 3/SCC | pure-definition |
+| SkillEffectRegistrar.js | 4 | pure-definition |
+| SkillEffectAliases.js | 3/SCC | pure-definition |
+
+**更新対象**: create_tests.sh, 全HTML, Deploy.bat, Local.js (SKILL_EFFECT_FILES)
+
+### バッチ8: app/ — アプリケーション層（8ファイル）
+
+| ファイル | Layer | 副作用分類 |
+|---------|-------|-----------|
+| SettingManager.js | 3/SCC | pure-definition |
+| AppData.js | 3/SCC | global-assignment |
+| AudioManager.js | 3/SCC | pure-definition |
+| Main_ImageProcessing.js | 3/SCC | pure-definition |
+| Main_OriginalAi.js | 3/SCC | pure-definition |
+| Main_MouseAndTouch.js | 3/SCC | global-assignment |
+| BattleSimulatorBase.js | 3/SCC | global-assignment |
+| VueComponents.js | 4 | initialization-root |
+
+**更新対象**: create_tests.sh, 全HTML, Deploy.bat
+
+### バッチ9: pages/ — ページエントリポイント（8ファイル）
+
+| ファイル | Layer | 副作用分類 |
+|---------|-------|-----------|
+| AetherRaidSimulatorMain.js | 3/SCC | global-assignment |
+| ArenaSimulatorMain.js | 3/SCC | global-assignment |
+| SummonerDuelsSimulatorMain.js | 3/SCC | global-assignment |
+| DamageCalculatorMain.js | 4 | global-assignment |
+| StatusCalcMain.js | 3/SCC | global-mutable-state |
+| UnitBuilderMain.js | 3/SCC | global-assignment |
+| HeroIconListerMain.js | 1 | global-mutable-state |
+| HeroStatusClustererMain.js | 4 | global-assignment |
+
+**更新対象**: create_tests.sh, 対応HTML, Deploy.bat
+
+### バッチ10（最後）: skill-impl/ — スキル実装（5ファイル）
+
+| ファイル | Layer | 副作用分類 |
+|---------|-------|-----------|
+| CustomSkill.js | 3/SCC | initialization-root |
+| SkillImpl.js | 5 | initialization-root |
+| SkillImpl202408.js | 4 | initialization-root |
+| SkillImpl202501.js | 5 | initialization-root |
+| SkillImpl202601.js | 5 | initialization-root |
+
+**更新対象**: create_tests.sh, 全HTML, Deploy.bat, Local.js (SKILL_IMPL_FILES)
+
+**コンフリクト注意**: update_skillsブランチとの衝突リスクが最も高い。移動しない判断もあり得る。
+
+---
+
+## 周辺ファイルのパス更新方式
+
+### create_tests.sh
+
+**方式A（採用）**: SOURCE_FILE_NAMESにディレクトリ付きパスを記載。
+
+```bash
+SOURCE_FILE_NAMES=(
+    core/GlobalDefinitions
+    core/GlobalDefinitions_Debug
+    core/Utilities
+    core/Logger
+    core/KeyRepeatHandler
+    data/SkillConstants
+    data/Skill
+    # ... 以下同様
+)
+# cat行は変更不要: cat ./Sources/${name}.js >> ./$TARGET_FILE
+```
+
+### HTMLファイルのloadScripts/additionalScripts配列
+
+ファイル名にディレクトリプレフィックスを追加:
+
+```javascript
+// Before
+"GlobalDefinitions.js",
+// After
+"core/GlobalDefinitions.js",
+```
+
+### Deploy.bat
+
+ファイル名変数にディレクトリプレフィックス（バックスラッシュ区切り）を追加:
+
+```bat
+rem Before
+set BF=GlobalDefinitions,Utilities,...
+rem After
+set BF=core\GlobalDefinitions,core\Utilities,...
+```
+
+### Local.js
+
+SKILL_EFFECT_FILESとSKILL_IMPL_FILESのパスにディレクトリプレフィックスを追加:
+
+```javascript
+const SKILL_EFFECT_FILES = [
+    "skill-dsl/SkillEffectCore.js",
+    "skill-dsl/SkillEffectEnv.js",
+    // ...
+];
+const SKILL_IMPL_FILES = [
+    "skill-impl/CustomSkill.js",
+    "skill-impl/SkillImpl.js",
+    // ...
+];
+```
+
+---
+
+## update_skillsブランチとのコンフリクト対策
+
+### コンフリクト発生箇所の予測
+
+| ファイル | リスク | 理由 |
+|---------|-------|------|
+| SkillImpl系ファイル | 高 | git mvによるrenameとupdate_skillsでの内容変更 |
+| Local.js | 中 | SKILL_IMPL_FILESへの新ファイル追加 |
+| HTML（loadScripts） | 中 | SkillImpl系の追加 |
+| create_tests.sh | 中 | SOURCE_FILE_NAMESへの新ファイル追加 |
+| Deploy.bat | 中 | skill_impl_filenames変数 |
+
+### 緩和策
+
+1. **SkillImpl系は最後のバッチ（バッチ10）で移動**: コンフリクト期間を最小化
+2. **git mvの徹底**: フォーマット変更を混ぜない（Gitのrename検出を確実にする）
+3. **Phase 2a全体を集中的に実施**: コンフリクト期間の短縮
+4. **バッチ10を移動しない選択肢も維持**: マージコストが高すぎる場合
+
+### マージ手順
+
+```
+1. update_skillsブランチでPhase 2a完了をコミット
+2. masterにマージ
+3. コンフリクト解決:
+   a. SkillImpl系ファイル: 新パスで内容はupdate_skills側を採用
+   b. Local.js / HTML / create_tests.sh / Deploy.bat: 新パス形式で新ファイル名を追加
+4. テスト実行 + ブラウザ確認
+5. コミット
+```
+
+---
+
+## 設計検証チェックリスト
+
+- [x] 全64 JSファイルがいずれかのディレクトリに割り当てられている（漏れなし）
+- [x] 1ディレクトリあたり5〜9ファイルの粒度（最小5、最大9）
+- [x] 循環依存がディレクトリ境界を跨ぐことは許容し、記録済み（39ファイルSCC）
+- [x] SkillImpl系ファイルの移動は最後のバッチ（コンフリクト対策）
+- [x] 移動バッチ計画の各バッチで更新対象が明確
+- [x] 周辺ファイル（create_tests.sh, HTML, Deploy.bat, Local.js）のパス更新方式が確定
+- [x] update_skillsブランチとのコンフリクト対策手順が記載
