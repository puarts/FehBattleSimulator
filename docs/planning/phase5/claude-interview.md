# Section 12 Interview Transcript

## Q1: vitest.setup.js の連結処理削除後、setup ファイル自体はどうするか？

**回答:** お任せ（リサーチ結果に基づいて最適な判断をしてほしい）

## Q2: DamageCalculator.test.js のESM化で、他の51テストと同じ import パターンを使うか？

**回答:** 他テストと同じパターンで良い。Section 12の最終形としてはそれが正しい。

詳細:
- 連結方式を廃止した後なら、DamageCalculator.test.js だけ特別扱いする理由は基本的になくなる
- これまでの問題は TestGlobals.js の ESM 世界と vitest.setup.js の連結世界が同時に存在したことによる混線
- Section 12 で連結が消えるなら、その混線前提も消えるので、通常パターンで揃えるのが自然

**注意事項（計画に入れるべき）:**
- DamageCalculator.test.js は移行完了後に HeroBattleTest を最優先で再検証する
- 失敗する場合は「ESM化の失敗」ではなく、以下を疑う:
  - ノード同一性依存
  - side-effect 登録順
  - initUnitSkillEffects(Unit) の適用順

## Q3: filterImportExport() 関数は連結廃止後に削除するか？

**回答:** 残す。

## Q4: WARN: Non-TDZ ReferenceError 警告の対応方針

**回答:** Section 12 で必ず解消対象にする。

- Section 12 の完了条件に「WARN: Non-TDZ ReferenceError が出ないこと」を入れる
- 消えなければその場で原因を切り分ける:
  1. vitest.setup.js にまだ古い処理が残っていないか
  2. TestGlobals.js / SkillImpl* / initUnitSkillEffects(Unit) の評価順
  3. 例外を握りつぶして warning にしている箇所の実体

## Q5: 連結廃止の作業順序

**回答:** 同時に変更が安全。

- DamageCalculator.test.js は連結世界に依存しているので、先にテストだけ ESM 化すると再び混線しやすい
- 逆に vitest.setup.js を先に切ると、DamageCalculator.test.js が即座に壊れる可能性が高い
- この2つは強く結合しているので、「片方だけ先に正しくする」中間状態が不安定

**おすすめの進め方:**
- 1つの変更セットで以下をまとめて入れる:
  - vitest.setup.js の連結廃止
  - TestGlobals.js の最終形への整理
  - DamageCalculator.test.js の ESM 化
- その直後に以下を順に確認:
  - DamageCalculator.test.js
  - SkillEffect.test.js
  - 全体テスト
