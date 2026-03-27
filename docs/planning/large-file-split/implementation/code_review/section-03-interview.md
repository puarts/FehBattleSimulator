# Code Review Interview: Section 03 - UnitContext

## Interview Items

### 1. ActionContext.clear() の hasThreatensEnemyStatus 重複代入（既存バグ）

**Category:** Ask user
**Finding:** ActionContext.clear() 内で `this.hasThreatensEnemyStatus = false;` が2回連続代入されている。おそらく1つは `this.hasThreatenedByEnemyStatus = false;` であるべき。
**Decision:** 別issueで対応。今回は「物理分割のみ・ロジック変更なし」の方針に従い、コードそのまま移動。
**Rationale:** 分割差分に既存バグ修正を混ぜると、問題発生時の切り分けが困難になるため。修正は別PR/別コミットで専用テスト付きで行う。
**Status:** 既存バグとして検出、今回未修正

## Auto-fixes

なし（コードは計画通りverbatim移動、修正不要）

## Let Go

- CombatResultType暗黙テスト: テストが十分にカバーしている
- ブラウザsmokeチェック: コードレビュー外の検証ステップ
