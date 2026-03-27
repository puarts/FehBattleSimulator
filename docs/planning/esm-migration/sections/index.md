<!-- PROJECT_CONFIG
runtime: typescript-npm
test_command: npm test
END_PROJECT_CONFIG -->

<!-- SECTION_MANIFEST
section-01-ast-analysis-tool
section-02-dependency-graph
section-03-strict-mode
section-04-directory-design
section-05-file-relocation
section-06-battlesimulatorbase-split
section-07-large-file-splits
END_MANIFEST -->

# Implementation Sections Index

## Dependency Graph

| Section | Depends On | Blocks | Parallelizable |
|---------|------------|--------|----------------|
| section-01-ast-analysis-tool | - | 02 | Yes |
| section-02-dependency-graph | 01 | 03, 04 | No |
| section-03-strict-mode | 02 | 05 | Yes |
| section-04-directory-design | 02 | 05 | Yes |
| section-05-file-relocation | 03, 04 | 06 | No |
| section-06-battlesimulatorbase-split | 05 | 07 | No |
| section-07-large-file-splits | 06 | - | No |

## Execution Order

1. section-01-ast-analysis-tool (no dependencies)
2. section-02-dependency-graph (after 01)
3. section-03-strict-mode, section-04-directory-design (parallel after 02)
4. section-05-file-relocation (after 03 AND 04)
5. section-06-battlesimulatorbase-split (after 05)
6. section-07-large-file-splits (after 06)

## Section Summaries

### section-01-ast-analysis-tool
**Phase 1 — グローバルシンボル抽出ツール**

カスタムAST解析スクリプトを作成し、各JSファイルのトップレベル宣言（クラス、関数、変数）と未定義参照を抽出する。Acorn/Babel parserを使用。ESLint `no-undef`による暗黙グローバル検出も組み合わせる。実行時グローバル差分の取得方法も設計する。

出力: 各ファイルの定義シンボル一覧、参照シンボル一覧、副作用分類（pure-definition / global-assignment / registry-provider / prototype-extension / initialization-root）

### section-02-dependency-graph
**Phase 1 — 依存グラフ構築**

section-01のAST解析結果を使い、ファイル間依存グラフを構築する。循環依存を検出して一覧化する。依存レイヤー図（レイヤー0〜N）を生成する。HTMLエントリポイントの本番/ローカル分類も行う。

出力: dependency-graph.md、副作用分類表、循環依存一覧、依存レイヤー分類、HTMLエントリポイント分類

### section-03-strict-mode
**Phase 1 — Strict Mode準拠化**

ESLintのstrictルールと関連ルール（no-implicit-globals、no-octal等）を使って静的にStrict Mode違反を検出し修正する。create_tests.shの結合方式の制約を考慮し、`"use strict";`の実際の追加はESM化フェーズまで保留する。

出力: Strict Mode違反の修正完了、ESLint設定の更新

### section-04-directory-design
**Phase 2a — ディレクトリ構成設計**

section-02の依存グラフと副作用分類に基づいて、最適なディレクトリ構成を設計する。依存方向が把握しやすい構成にする。移動バッチの計画（依存の強い塊をまとめる）も策定する。update_skillsブランチとのコンフリクト対策も含む。

出力: ディレクトリ構成設計書、移動バッチ計画、コンフリクト対策手順

### section-05-file-relocation
**Phase 2a — ファイル移動の実施**

section-04の設計に基づいてファイルを物理的に移動する。git mvを使用。各バッチでcreate_tests.sh、HTML、Deploy.bat、Local.jsのパスを更新し、テスト+ブラウザ確認を行う。JSコードの内容は一切変更しない。

出力: 移動完了、更新されたcreate_tests.sh、HTML、Deploy.bat、Local.js

### section-06-battlesimulatorbase-split
**Phase 2b — BattleSimulatorBase.js分割**

12,307行のGod Objectを責務ごとに分割する。コアフレーム、バトルロジック、移動システム、コマンドキュー、設定永続化、Vue統合レイヤー（最後）の順で分離。各ステップでテスト+ブラウザ確認。BattleSimulatorBaseインスタンスを丸ごと渡すパターンは避ける。

出力: 分割後のファイル群、更新されたcreate_tests.sh、Deploy.bat、HTML、Local.js

### section-07-large-file-splits
**Phase 2b — その他の巨大ファイル分割**

DamageCalculatorWrapper.js（17,193行）とSkillEffect.js（9,632行）を分割する。PerformanceProfile抽出、戦闘ユーティリティ分離、SkillEffect基盤/クエリノード/エフェクトノード分離。SkillImpl系は分割しない。

出力: 分割後のファイル群、更新されたcreate_tests.sh、Deploy.bat
