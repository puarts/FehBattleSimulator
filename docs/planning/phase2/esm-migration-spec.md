# Phase 2: ESモジュール化 — スペック

## 目的

FEH Battle Simulator の65個のJSファイルをグローバルスコープから ES Modules（import/export）に段階的に移行する。

## 背景

### プロジェクト概要
- Fire Emblem Heroes のバトルシミュレーター（飛空城・闘技場・召喚士決闘・戦渦の連戦）
- vanilla JavaScript + Vue 2.5.13（CDN） + jQuery 3.7.0（CDN）
- 65個のJSファイル、約12MB、モジュールシステムなし
- 全ファイルがグローバルスコープで動作

### 完了済みフェーズ
- **Phase 0**: スモークテスト追加（Tests/SmokeTest.test.js）
  - グローバル変数の存在チェック、スキル登録の整合性、基本動作確認
- **Phase 1**: Node.js ビルドスクリプト（scripts/build.mjs）
  - Deploy.bat と同等のファイル結合処理を Node.js で実装
  - `npm run build` / `npm run deploy` で実行可能

### 現在のビルド・テスト構成
- **ビルド**: `scripts/build.mjs` — ファイルリストに従い結合、HTMLごとに1ファイル出力（7種類）
- **テスト**: `create_tests.sh` — 全ソース+テストを結合して `All.test.js` → Jest（jsdom）実行
- **ローカル開発**: HTMLファイルを直接ブラウザで開く。`Local.js` のファイル配列 + `loadScripts()` で個別JS動的読み込み
- **デプロイ**: `npm run deploy` — 結合+圧縮+コピー（Deploy.bat互換）

## 制約

1. **デプロイ出力の維持**: HTMLごとに1つのJSファイルに結合して出力する必要がある
2. **並行開発**: スキル実装（update_skillsブランチ）と並行して進めるため、大規模な構造変更は段階的に行う
3. **段階的移行**: 過去にESM化+Vite導入を同時にやろうとして循環依存で断念。1ファイルずつ変換し、各変換後にテスト確認する
4. **依存の葉から変換**: 他ファイルへの依存が少ないファイルから着手し、循環依存を最小化する

## 移行方針（Phase 2 の方向性）

### Stage A: 依存なし・ユーティリティ層
Utilities.js, Logger.js, Cell.js, Table.js

### Stage B: 定数・列挙型
GlobalDefinitions_Debug.js, SkillConstants.js, HeroInfoConstants.js, UnitConstants.js

### Stage C: コアモデル
Unit.js, BattleMap.js, AppData.js, BattleContext.js

### Stage D: ビジネスロジック
DamageCalculator.js, DamageCalculatorWrapper.js, BeginningOfTurnSkillHandler.js

### Stage E: スキルDSL・実装
SkillEffect*.js（DSL基盤）, SkillImpl*.js（副作用モジュール）

### Stage F: UI層
VueComponents.js, BattleSimulatorBase.js, *Main.js

## 求めること

1. **依存グラフの解析**: 65ファイルの実際の依存関係を解析し、最適な変換順序を決定
2. **循環依存の特定**: リスクが高い箇所を事前に特定し、解決策を計画
3. **ビルドスクリプト対応**: 各Stageで build.mjs をどう変更するか
4. **テスト基盤の移行**: create_tests.sh（結合方式）→ ESM対応テスト（Vitest等）への移行計画
5. **ローカル開発の移行**: loadScripts() → Vite dev server への移行タイミング
