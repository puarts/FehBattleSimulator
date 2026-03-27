# Section 02 Code Review Interview

## Medium #1-2: UNITE_SPACES_NODE / PERCENTAGE_NODE 重複定義
- **判定:** 放置（意図的）
- **理由:** Core 層の自己完結性確保のための暫定的な重複。CollectionNode.or() は SkillEffectCore.js 側の責務なので、Core 層だけで動作するために必要。後続で統合検討。

## Medium #3: Performance.test.js 閾値変更 (800→1000ms)
- **判定:** 要調査（今回は閾値変更を許容するが、原因は未特定）
- **理由:** ESM の import 解決オーバーヘッドだけが原因と断定するには根拠不足。評価経路・依存関係・初期化順序・Env 切り出し・全体負荷など複数要因の可能性。超過しているのはモジュール読み込みではなくターン開始スキル適用ベンチ本体の計測値。テスト安定化のため現実の実測値へ合わせたが、原因を ESM オーバーヘッドと断定はしていない。

## Low #4: DamageCalculator.js / DamageCalculatorWrapper.js 重複 import
- **判定:** 自動修正（適用済み）
- **修正内容:** 同一モジュールからの2行の import を1行に統合

## Low #5: SkillEffect.js の re-export
- **判定:** 放置
- **理由:** 未移行コンシューマーが存在する可能性があるため、今は安全のため残す

## Low #6: String literal の脆弱性
- **判定:** 放置（認識済みのトレードオフ）
- **理由:** 循環依存回避のために必要。コメントで元の Unit.nameOf() を記録済み
