# コードベース構造改善 — TDD計画

本ドキュメントは`claude-plan.md`の各フェーズに対応するテスト方針を定義する。

## テスト基盤の現状

- **フレームワーク**: Jest + jsdom
- **テストファイル**: 16スイート（Tests/配下）
- **実行方式**: `create_tests.sh`で全ソースを結合→`All.test.js`→Jest実行
- **テストユーティリティ**: UnitBuilder, BattleScenarioBuilder, RegressionTestHelper
- **CI**: GitHub Actions（Jest + ESLint）

## Phase 1: 依存関係の可視化

### 2.2 グローバルシンボルの抽出

テスト対象: カスタムAST解析スクリプト（作成する場合）

```
# Test: AST解析スクリプトがクラス定義を正しく抽出する
# Test: AST解析スクリプトがグローバル変数参照を正しく検出する
# Test: AST解析スクリプトがトップレベル副作用を分類できる
# Test: 結果JSONの形式が正しい（定義シンボル、参照シンボル、副作用カテゴリ）
```

### 2.3 依存グラフの構築

テスト対象: 依存グラフ構築ロジック

```
# Test: 依存グラフが循環依存を正しく検出する
# Test: 依存レイヤー分類が正しい（レイヤー0はどこからも参照されないファイルのみ）
# Test: 既知の依存関係（create_tests.shの順序）と矛盾しない
```

### 2.4 Strict Mode準拠化

テスト: 既存テストスイート全体

```
# Test: ESLint strictルール（no-implicit-globals, no-octal等）でエラーが0件
# Test: Strict Mode違反修正後、既存テスト16スイートがすべてパス
# Test: 修正後、本番7ページがブラウザで正常動作
```

## Phase 2a: ディレクトリ再構成（物理移動のみ）

### 3.3 ファイル移動

テスト: 既存テストスイート + ブラウザ確認

```
# Test: 各移動バッチ後にcreate_tests.shが正常にAll.test.jsを生成
# Test: 各移動バッチ後にJestテストがすべてパス
# Test: 各移動バッチ後にDeploy.batが正常に結合JSを生成
# Test: 各移動バッチ後に本番7ページがブラウザで正常動作
# Test: Deploy.bat出力のJSファイルサイズが移動前と同等（結合内容が同じことの確認）
```

### 3.4 update_skillsブランチとのコンフリクト対策

```
# Test: git mergeまたはrebase時にSkillImpl系ファイルのコンフリクトが発生しない
#       （SkillImpl系を移動しなかった場合）
# Test: マージ後にテストがすべてパス
```

## Phase 2b: 巨大ファイルの責務分割

### 4.2 BattleSimulatorBase.js分割

テスト: 分割対象の動作に関連する既存テスト + 新規テスト

#### 分割前に確認すべきテストカバレッジ

```
# Test: BattleSimulatorBaseの主要メソッドがテストでカバーされているか確認
# Test: カバレッジが不足している場合、分割前にテストを追加
```

#### 各責務モジュール切り出し時

**コアフレーム（コンストラクタ・初期化）:**
```
# Test: コンストラクタが正常にインスタンスを生成する
# Test: 初期化処理が正しい順序で実行される
# Test: 子クラス（AetherRaidSimulator等）が正常に拡張できる
```

**バトルロジック:**
```
# Test: ターン処理が正常に動作する
# Test: 戦闘シミュレーションの結果が分割前と同一
```

**移動システム:**
```
# Test: パスファインディングが正しい経路を返す
# Test: 移動可能範囲計算が正しい
```

**コマンドキュー:**
```
# Test: コマンドのキューイングと実行順序が正しい
```

**設定永続化:**
```
# Test: セーブ/ロードが正常動作する
# Test: 分割後もlocalStorageの既存データが読み込める（後方互換性）
```

**Vue統合レイヤー（最後に分割）:**
```
# Test: Vue VMが正常に生成される
# Test: Vuexストアが正常に動作する
# Test: コンポーネント間のデータバインディングが正常
```

### 4.3 DamageCalculatorWrapper.js分割

```
# Test: PerformanceProfile切り出し後、プロファイリングが正常動作
# Test: ユーティリティ関数切り出し後、ダメージ計算結果が分割前と同一
# Test: 既存のDamageCalculatorテストスイートがすべてパス
```

### 4.4 SkillEffect.js分割

```
# Test: 基盤インフラ切り出し後、ベースノードが正常動作
# Test: クエリノード切り出し後、全クエリノードが正常動作
# Test: エフェクトノード切り出し後、全エフェクトノードが正常動作
# Test: Mixinパターン（Object.assign）が分割後も正常に適用される
# Test: 既存のSkillEffectテストスイートとDslNodeテストがすべてパス
# Test: SkillImpl系からの参照が正常動作（SkillRegressionテスト）
```

### 全Phase 2b共通

```
# Test: 分割後にDeploy.batが正常に結合JSを生成
# Test: 分割後の結合JSが分割前と機能的に同等（同じ入力に対して同じ出力）
# Test: 分割後に本番7ページがブラウザで正常動作
# Test: CIが成功（Jest + ESLint）
```

## 回帰テスト戦略

各フェーズの全ステップで以下を実行:

1. `./run_tests.sh` — 全テストパス
2. ブラウザで本番7ページの起動確認
3. Deploy.batで結合JS生成の確認
4. ESLintパス

Phase 2bでは追加で:
5. localStorageの既存データが読み込めることの確認
6. URLパラメータが正常に処理されることの確認
