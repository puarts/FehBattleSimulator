# Phase 2 インタビュー記録

## Q1. 循環依存（Unit ↔ DamageCalculator）への対応

**質問**: Unit.js ↔ DamageCalculator.js の循環依存が最大のリスク。リファクタリング（分離・依存注入）の許容範囲は？

**回答**: 必要ならリファクタ OK。ファイル分割やクラス構造の変更も許容。

## Q2. テスト基盤の移行タイミング

**質問**: Jest → Vitest の移行タイミング。ESM化と同時に段階的か、全完了後に一括か？

**回答**: お任せ。

**判断**: ESM化と同時に段階的に移行する。ESM化したファイルから順次 Vitest テストを追加し、Jest と並行運用。全移行完了後に Jest を削除する方針。

## Q3. SkillImpl*.js の import 文スタイル

**質問**: SkillImpl ファイルの先頭に import 文が大量に追加されることへの懸念は？

**回答**: 直接import（明示的）を選択。import文が増えても明示的な依存関係の方が良い。

## Q4. ローカル開発方式

**質問**: ESM化後のローカル開発で Vite dev server を使うか、HTML直接開きを維持するか？

**回答**: お任せ。ただしなるべくモダンな方法にしたい。

**判断**: Vite dev server（HMR付き）に移行する。ただし Phase 2 のスコープ外（Phase 3 で対応）。

## Q5. Phase 2 のスコープ

**質問**: Phase 2 の完了条件として、ESM化のみか、Vite build や Vitest も含めるか？

**回答**: ESM化のみ。ビルドツール切り替えや Vitest 移行は別フェーズ。

**確定スコープ**: 65ファイルに import/export を追加し、既存テスト（create_tests.sh + Jest）が引き続きパスすること。build.mjs の結合出力も維持。
