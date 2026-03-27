# Code Review Interview: Section 04 - UnitUtility

## Interview Items

なし。レビューで発見された項目はすべて低リスクで、ユーザー判断不要。

## Auto-fixes

なし（コードは計画通りverbatim移動、修正不要）

## Let Go

- `.call(this, ...)` パターン: calcHealAmount/isAfflictor内の既知の技術的負債。計画書で明記済み、ロジック変更禁止ルールにより今回未修正
- 存在チェックのみのテスト: 純粋移動リファクタリングとして妥当。既存テストが回帰検出を担保
