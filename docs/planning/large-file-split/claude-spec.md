# 統合仕様書: 巨大ファイル分割リファクタリング

## 概要

ESM移行計画（section-05/06完了済み）の一環として、DamageCalculatorWrapper.jsとUnit.jsの2ファイルから、独立性の高いクラス・関数を別ファイルに抽出する。グローバルスコープ前提でのファイル分割のみ行い、ESM（import/export）は導入しない。

ブランチ: `refactor/large-file-splits`

## 確定した実装スコープ

### Phase A: DamageCalculatorWrapper.js (17,193行)

**Phase A-1**: `PerformanceProfile` クラス (27行, lines 2-28) を `Sources/combat/PerformanceProfile.js` に抽出
- 依存なし、純ユーティリティ
- DamageCalculatorWrapperのコンストラクタで`new PerformanceProfile()`として使用されるため、先にロード

**Phase A-2**: `ScopedTileChanger` クラス (22行, lines 30-52) を `Sources/combat/ScopedTileChanger.js` に抽出
- Unit, setUnitToTile()への依存あり
- DamageCalculatorWrapper内でのみ使用されるため、その直前にロード

**対象外（確定）**:
- staticメソッド群: 全て内部呼び出しのみ。外部再利用性がなく分離メリットが薄い。DamageCalculatorWrapper内に残す
- インスタンスメソッド群: `this`に密結合で分割困難

### Phase B: Unit.js (7,424行)

**Phase B-1**: 独立クラス群 → `Sources/unit/UnitContext.js` (約326行)
- `AttackableUnitInfo` (lines 19-51, 33行) — データコンテナ
- `AttackEvaluationContext` (lines 54-120, 67行) — 攻撃優先度評価
- `AssistableUnitInfo` (lines 123-268, 146行) — アシスト対象評価
- `ActionContext` (lines 271-350, 80行) — AI意思決定コンテキスト

**Phase B-1 (追加)**: `PrecombatContext` (lines 356-371, 16行) → `Sources/unit/BattleContext.js` に移動
- BattleContextとの責務的な近さを優先（copyToでBattleContextにコピーする関係）

**Phase B-2**: ユーティリティ関数群 → `Sources/unit/UnitUtility.js` (約259行)
- `UnitUtil` クラス (lines 7144-7164, 21行)
- `calcBuffAmount()` (lines 7166-7206, 41行)
- `calcHealAmount()` (lines 7214-7296, 83行)
- `isDebufferTier1()` (lines 7300-7308, 9行)
- `isDebufferTier2()` (lines 7311-7348, 38行)
- `isAfflictor()` (lines 7357-7420, 64行)
- `canRefreshTo()` (lines 7422-7424, 3行)

**Unit.jsに残すもの**:
- 極小トップレベル関数: `isThief`, `calcArenaBaseStatusScore`, `calcArenaTotalSpScore` (各3行)
- Unit クラス本体 (6,770行, 650+メソッド)

## 実装順序

Phase A-1 → A-2 → B-1 → B-2 の順（4コミット）

小規模・低リスクのDamageCalculatorWrapperから始め、create_tests.sh/Deploy.bat/HTML更新の実務フローを確立してからUnit.jsに進む。

## 制約

- グローバルスコープ前提（ESMは導入しない）
- create_tests.shの`SOURCE_FILE_NAMES`に新ファイルを追加（ロード順序を守る）
- Deploy.batの結合リストを更新
- HTMLファイルのloadScriptsは、抽出ファイルがブラウザで直接読み込まれる場合のみ更新
- 後方互換性維持（セーブデータ・URLパラメータを壊さない）

## 各ステップの検証プロセス

1. `./run_tests.sh` — 全テスト + ESLint パス
2. ブラウザsmoke check:
   - Phase A: DamageCalculator.htmlでダメージ計算UI1回実行
   - Phase B: ArenaSimulator.htmlまたはUnitBuilder.htmlで基本操作1つ
3. コンソールエラーなし

## 成功基準

- 回帰なし（全テストパス、ESLintクリーン）
- 責務境界が明確（各抽出ファイルが単一の関心事を持つ）
- ロード順序維持（グローバルスコープでの依存関係が正しく保たれる）
- git bisect可能な粒度のコミット（4コミット）
