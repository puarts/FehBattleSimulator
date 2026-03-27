# Code Review: Section 04 - ディレクトリ構成設計

## High Severity

### 1. Cross-directory dependency分析の不足
39ファイルSCCを8ディレクトリに分割するが、クロスディレクトリ依存のエッジ数分析がない。例: SkillEffect.js (skill-dsl/) → BattleSimulatorBase.js (app/), DamageCalculator.js (combat/), AppData.js (app/), Unit.js (unit/) で4つのクロスディレクトリ依存。

### 2. initialization-rootファイルのロード順序
create_tests.shのSOURCE_FILE_NAMES順序がディレクトリ移行で変わる可能性。initialization-rootファイル（SkillConstants, Skill, Tile, BattleMap等）は順序依存あり。

## Medium Severity

### 3. PostCombatSkillHander.jsのtypo
Handler → Hander のtypoが実ファイル名に存在。git mv時にリネームする機会だが、本セクションのスコープ外（設計のみ）。

### 4. HeroIconListerMain.jsの配置
Layer 1で多くのLayer 3ファイルから参照されるが、pages/（バッチ9）に配置。バッチ1-8の間は旧パスのまま。

### 5. Deploy.bat/MergeSourcesAndCompress.batのパス解決
バックスラッシュ区切りのパスが実際に動くか未検証。section-05で確認必要。

## Low Severity

### 6-9. バッチ順序根拠、ロールバック計画、CSS考慮等

## Plan Compliance
設計チェックリスト7項目すべてカバー。section-02の依存グラフデータを正しく使用。
