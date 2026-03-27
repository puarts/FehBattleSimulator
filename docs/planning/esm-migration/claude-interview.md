# ESM/Vite移行 インタビュー記録

## Q1: Vue 2 → Vue 3 のアップグレードスコープ

**質問**: Vue 2.5.13はEOLです。今回のVite移行と同時にVue 3へのアップグレードも行いますか？

**回答**: ESM移行後に別プロジェクトとして行う。

## Q2: jQuery/jQuery UIの扱い

**質問**: jQueryは11ファイルで主にUIダイアログとDOM操作に使われています。今回の移行での扱いは？

**回答**: ESM移行後に別途除去する。今回のスコープには含めない。

## Q3: 巨大ファイルの分割

**質問**: BattleSimulatorBase.js（12,307行）はGod Objectです。Phase 2でファイル分割も行いますか？

**回答**: Phase 2で分割も行う。

## Q4: vite-plugin-legacy-js-concatの採用

**質問**: レガシー結合プラグインで既存動作を維持しながらViteを導入するアプローチを採用しますか？

**回答**: 検討が必要。プラグインの安定性やメンテナンス状況を先に確認したい。

## Q5: 開発スタイルの変更

**質問**: HTMLファイルを直接ブラウザで開く方式から`vite dev`サーバー経由への変更に懸念は？

**回答**: デプロイ担当者が全てを結合したJSファイルを本番用のこのリポジトリにないHTMLファイルから読み込む構成なので、しばらくは本番デプロイ用に単一のJSファイルを出力できるようにしてほしい。

## Q6: デプロイ構成

**質問**: GitHub Pagesでのデプロイはどのように行っていますか？

**回答**: Deploy.batで必要なJSファイルを結合した単一JSファイルをaether, arena等の個別にサーバーにデプロイしている。Deploy.batを参考にこれらのJSファイルを出力できるようにしてほしい。

### Deploy.batの構成（確認済み）

- ページごとに異なるファイルセットを結合してデプロイ
- 出力ファイル: FehBattleSimulator.js, FehArenaSimulator.js, FehSummonerDuelsSimulator.js, FehStatusCalculator.js, FehUnitBuilder.js, FehDamageCalculator.js, FehHeroIconLister.js
- MergeSourcesAndCompress.batでJSMin圧縮

## Q7: ビルド出力の方針

**質問**: Vite buildでDeploy.batと同等の出力を生成することを目標にしますか？

**回答**: 当面はVite buildとDeploy.batを両方維持する。

## Q8: 検証方法

**質問**: 各フェーズ完了時点での動作確認方法は？

**回答**: テスト+手動ブラウザ確認。

## Q9: 並行作業とブランチ戦略

**質問**: スキル実装の追加は移行中も並行して続けますか？

**回答**: 別ブランチで移行を進める。update_skillsブランチから切る。スキル追加はupdate_skillsブランチで継続。

## Q10: タイムライン

**質問**: 移行のタイムラインやマイルストーンに制約は？

**回答**: 特に期限なし。品質優先で段階的に進める。

## Q11: モジュール設計のディレクトリ構成

**質問**: 以前提案した構成（core/, constants/, model/, combat/, skill/, database/, map/, ui/, app/）に対するフィードバックは？

**回答**: その提案はソースコードを調査した結果に基づいたものか、一般的な構成の例か確認したい。

**補足**: 以前の提案は一般的なパターンに基づくもので、詳細なコード分析結果に基づいていなかった。Phase 1の依存関係分析結果に基づいて最適な構成を導き出す。
