# Section 02 Code Review Interview

## Auto-fixes Applied

1. **Deploy.bat HTML parsing fix** — 複数の `set copyfiles=` 行のうち、HTML コピーセクションに近い方を使用するよう修正。7本番+1ローカルの正しい分類に。
2. **HTML script extraction fix** — `additionalScripts = [...]` パターンに対応。全HTMLのJSファイルセットを正しく抽出。
3. **classifyLayers safety guard** — 固定点反復に `maxIterations` ガードを追加。

## User Decision: 巨大SCC（39ファイル）の扱い

**決定**: 現状のまま進める + レポートに既知パターンを補記

**理由**:
- 39ファイルの巨大SCCはグローバル依存の推移的な絡み合いの実態を正確に反映
- 最小循環抽出は解析ツール作りが目的化しやすい
- Phase 2a/2b で重要なのは「どこが独立していないか」を知ること
- レポートに既知の代表パターン3つを局所循環として記載し、Section-04の入力とする

**対応**:
- dependency-graph.md の循環依存セクションに代表的な局所循環パターン表を追記
- AppData ↔ BattleSimulatorBase、Unit ↔ BattleContext ↔ BattleMap、DamageCalculator ↔ PostCombatSkillHandler

## Let Go

- ファイル命名(.js vs .mjs) — section-01 の CJS パターンと整合
- 副作用分類の粒度差 — 実装の方がプランより詳細で問題なし
- 空グラフのエッジケーステスト — 実用上不要
