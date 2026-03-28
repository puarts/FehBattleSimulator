# DamageCalculatorWrapper.js 分割リファクタリング

## 背景

`Sources/combat/DamageCalculatorWrapper.js` は 17,141行の巨大クラスで、戦闘計算に関するほぼすべてのロジックが1ファイルに集約されている。可読性・保守性の向上のため、責務ごとにファイルを分割する。

前回の `large-file-split` リファクタリングで `PerformanceProfile` と `ScopedTileChanger` を抽出済み（各々独立クラスだったため容易に分離できた）。今回は DamageCalculatorWrapper クラス本体のメソッド群を責務ごとに分離する。

## 対象ファイル

- `Sources/combat/DamageCalculatorWrapper.js` (17,141行、1クラス約140メソッド)

## 目標

- DamageCalculatorWrapper.js を責務ごとに複数ファイルに分割し、各ファイルを3,000〜5,000行以下にする
- ロジック変更なし（物理分割のみ）
- 既存テスト全パスを維持
- ブラウザ・テスト・Deploy.bat の3系統のロード順序を正しく更新

## 分割の方針

DamageCalculatorWrapper は単一クラスであるため、クラス抽出ではなくメソッド群の分離が必要。以下のアプローチを検討する:

1. **Mixinパターン**: 責務ごとのメソッド群を別ファイルに定義し、prototype に追加
2. **ヘルパークラス抽出**: 特定の責務を持つメソッド群を新クラスとして切り出し、DamageCalculatorWrapper から委譲
3. **関数抽出**: クラスメソッドのうちthisへの依存が少ないものをスタンドアロン関数として抽出

deep-plan でどのアプローチが最適か、メソッド間の依存関係を分析した上で決定する。

## 責務の大まかな分類（候補）

メソッド名のプレフィックスと行範囲から推定される責務グループ:

| 責務 | 行範囲（目安） | 主要メソッド |
|------|-------------|-------------|
| 戦闘結果計算の入口 | 119-548 | updateDamageCalculation, calcDamage, calcPreCombatResult, calcCombatResult |
| 範囲奥義・戦闘前スキル | 493-1000 | calcPrecombatSpecialDamage, __applyPrecombatSkills, __getSaverUnit |
| ダメージ軽減 | 1000-1383 | __applyPrecombatDamageReductionRatio, __applyResDodge 等 |
| スキル効果辞書（初期化） | 1564-2281 | __init__applySkillEffectFor{Atk,Def}UnitFuncDict |
| スキル効果適用（メイン） | 2281-9400 | __applySkillEffectForUnit 系（巨大 switch/辞書ベース） |
| 追撃判定 | 13695-14288 | __examinesCanFollowupAttack 系 |
| 反撃判定 | 13987-14288 | canCounterAttack, __canDisableCounterAttack |
| 紋章・鼓舞（Spur） | 9864-10427, 15419-16978 | __applySpursFromAllies, __updateUnitSpur 系 |
| 奥義効果 | 14853-15183 | __init__applySpecialSkillEffect, __applySpecialSkillEffect |
| ユーティリティ | 15322-15409, 10631-10669 | enumerate系, __count系, __isNear 等 |

## 制約

- **後方互換**: 外部から参照される public メソッドのシグネチャは変更しない
- **ロード順序**: 3系統（create_tests.sh, Deploy.bat, HTML×7）すべて更新
- **テスト**: `./run_tests.sh` で全テスト + ESLint パス
- **パース時依存**: JavaScriptのクラス定義はhoistされないため、分割先ファイルのロード順序に注意
- **前回の分割との整合**: PerformanceProfile, ScopedTileChanger は既に分離済み

## 成果物

- 分割後の新規ファイル群（`Sources/combat/` 配下）
- 更新された DamageCalculatorWrapper.js（大幅に縮小）
- ロード順序の更新（3系統）
- シンボル可視性テスト
