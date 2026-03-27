# インタビュー記録: 巨大ファイル分割リファクタリング

## Q1: DamageCalculatorWrapper.jsのstaticメソッドの扱い

**質問**: staticメソッド群は全て内部呼び出しのみでした。section-07計画書ではStep 3で「CombatUtility.jsへの分離検討」がありますが、実際にはメリットが薄いです。staticメソッドの扱いはどうしますか？

**回答**: staticメソッドの外部分離はスキップが妥当。

- 全て内部呼び出しのみなら、CombatUtility.jsに出しても依存が減らない
- DamageCalculatorWrapperの責務境界もあまり改善されず、ファイル数とロード順管理だけ増える
- 「将来のESM化のため」という理由だけで今分離すると、薄い抽出になりやすい
- 「無理に分割しない」原則と整合する
- 実装はPerformanceProfileとScopedTileChangerの抽出だけに絞る
- section-07/新spec側は「内部専用staticメソッドは分離対象外。外部再利用性が確認できた場合のみ別ファイル化を検討」と明記する
- 「検討ステップだけ残す」は実装時に迷いを再注入しやすいので避ける

## Q2: Unit.jsからの抽出グルーピング

**質問**: Unit前の独立クラス5つ(342行)とUnit後のユーティリティ関数群(259行)が抽出候補です。これらをどうグループ化しますか？

**回答**: 2ファイルに分離。

- `UnitContext.js` — Unit前にある独立クラス群
- `UnitUtility.js` — Unit後ろのトップレベル関数群
- 理由: クラス群と関数群で責務がはっきり分かれる。1ファイルまとめだと雑多箱になりやすく、3ファイル以上は342行+259行規模だと過分割気味
- ロード順: UnitContext.jsをUnit.jsより前、UnitUtility.jsは利用箇所に応じて前後を決める
- 配置: `Sources/unit/UnitContext.js`、`Sources/unit/UnitUtility.js`

## Q3: 実装順序

**質問**: Phase A (DamageCalculatorWrapper) と Phase B (Unit.js) はどちらを先に行いますか？

**回答**: Phase A → Phase Bの順。

- DamageCalculatorWrapper側は小さく抽出対象も明確で失敗コストが低い
- 先に分割手順を固めると、create_tests.sh/Deploy.bat/HTML/ロード順更新の実務フローを確認できる
- Unit.jsは610行規模で依存確認やロード順判断も少し重いので後に回す
- 進め方: Phase A-1 → A-2 → B-1 → B-2
- 並行実施は不要。ロード順と結合順を触るので同時にやるとレビューしにくい

## Q4: Unit.jsの極小トップレベル関数の扱い

**質問**: isThief, calcArenaBaseStatusScore, calcArenaTotalSpScoreは3行ずつの極小関数です。どこに入れますか？

**回答**: Unit.jsに残す。

- 3行関数を動かしてもファイル分割の効果がほぼない
- 小さすぎるので、抽出先の責務を強める材料にもなりにくい
- 「無理に分割しない」原則に従う
- calcArenaBaseStatusScore/calcArenaTotalSpScoreはUnitの近くにあった方が読みやすい

## Q5: PrecombatContextの配置先

**質問**: PrecombatContext(16行)はBattleContext.jsとの関係が密です（copyToでBattleContextにコピーする）。UnitContext.jsとBattleContext.jsのどちらが適切ですか？

**回答**: BattleContext.jsに移動。

- copyToでBattleContextに値を移すなら、責務はUnit補助というより戦闘コンテキスト側
- 「Unit.jsから出たものを全部UnitContext.jsに入れる」という整理都合より、実際の依存方向を優先
- 16行と小さいので、UnitContext.jsの中で異質なクラスとして残すより近い文脈へ寄せる
- 結果: PrecombatContext → BattleContext.js、残り4クラス → UnitContext.js

## Q6: ブラウザ動作確認の範囲

**質問**: ブラウザ確認を行う際、具体的に何を検証しますか？

**回答**: ページ読み込み + 軽いsmoke check。

- 今回は構造変更であり仕様変更ではない。戦闘ロジックの妥当性は`./run_tests.sh`に寄せる
- 各ステップで戦闘結果の正しさまで見ると手動確認コストが重すぎる
- 確認内容:
  1. ページが開く
  2. コンソールエラーが出ない
  3. 初期UI操作が1つできる
  4. 抽出対象に関係する画面なら、その入口操作が1つ通る
- 具体例:
  - DamageCalculatorWrapper抽出後: DamageCalculator.htmlでダメージ計算UIを1回実行
  - Unit.js抽出後: ArenaSimulator.htmlかUnitBuilder.htmlでユニット表示/編集の基本操作1つ
