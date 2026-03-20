# Phase 2 統合スペック: ESモジュール化

## 概要

FEH Battle Simulator の65個のJSファイルをグローバルスコープから ES Modules（import/export）に段階的に移行する。

## スコープ

### 含まれるもの
- 全65 JSファイルへの `export`/`import` 文の追加
- 循環依存の解消（必要に応じたリファクタリング含む）
- 既存テスト（create_tests.sh + Jest）の動作維持
- 既存ビルド（build.mjs 結合出力）の動作維持

### 含まれないもの
- ビルドツールの切り替え（build.mjs → Vite build）は Phase 3
- テスト基盤の移行（Jest → Vitest）は Phase 3
- ローカル開発方式の変更（loadScripts → Vite dev server）は Phase 3
- Vue 2 → Vue 3 移行は Phase 3

## 前提条件（完了済み）

- Phase 0: スモークテスト（Tests/SmokeTest.test.js）
- Phase 1: Node.js ビルドスクリプト（scripts/build.mjs）

## 技術的制約

1. **デプロイ出力維持**: HTMLごとに1つのJSファイルに結合して出力する必要がある
2. **テスト互換性**: create_tests.sh の結合方式が引き続き動作すること
3. **並行開発**: update_skills ブランチでのスキル実装と並行して進める
4. **段階的変換**: 1ファイルずつ変換し、各変換後にテスト確認

## 依存グラフ（リサーチ結果より）

### 階層構造

| Tier | レイヤー | ファイル数 | 循環依存リスク |
|------|---------|----------|--------------|
| 0 | インフラ | 7 | なし |
| 1 | 定数・列挙型 | 3 | なし |
| 2 | データ構造 | 5 | なし |
| 3 | 情報クラス | 5 | なし |
| 4 | コアゲーム | 5 | **高（Unit↔DamageCalc）** |
| 5 | スキルDSL | 9 | なし |
| 6 | スキル実装 | 5 | 副作用ファイル |
| 7 | 戦闘計算 | 5 | **高（Unit↔DamageCalc）** |
| 8 | アプリ層 | 2 | 収束点 |
| 9 | UI・エントリ | ~12 | なし |

### 循環依存（要解決）
- **Unit.js ↔ DamageCalculator.js**: 高リスク。リファクタリングで解消する（許可済み）
- **Unit.js ↔ BattleContext.js**: 中リスク。型参照のみなら ESM で問題なし
- **Unit.js ↔ BattleMap.js**: 中リスク。Tile を中間層として分離可能

### 副作用ファイル（SkillImpl*.js）
- ファイル読み込み時にスキルをグローバルマップ/フックに登録
- ESM 化後は `import './SkillImpl.js'` で副作用を発火
- 読み込み順序の維持が必要

## 設計決定事項

1. **import スタイル**: 直接import（明示的）。バレルファイルは使わない
2. **循環依存対応**: 必要ならリファクタリング（ファイル分割・依存注入）OK
3. **変換順序**: 依存の葉（Tier 0）から上位（Tier 9）へボトムアップ
4. **互換性**: export 文を追加しても、create_tests.sh の結合モードでは無視される（グローバルにも残る）

## 成功基準

1. 全65ファイルが import/export を使用している
2. 既存の305テストが全てパス（create_tests.sh + Jest）
3. スモークテスト（Phase 0）が全てパス
4. `npm run build` の出力が正常に動作する
5. ローカル開発（HTML直接開き + loadScripts）が引き続き動作する
