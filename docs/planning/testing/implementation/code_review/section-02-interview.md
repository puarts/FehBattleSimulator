# Code Review Interview: Section 02

## Auto-fixes Applied

- **#2/#3 extractCombatSnapshot拡充**: totalAttackCount（追撃回数検出用）、preCombatDamageを追加
- **#4 build()でsaveCurrentHpAndSpecialCount()呼び出し**: restHpスナップショットの整合性を保証
- **#9 withHpメソッド追加**: withAtk/withSpd等と一貫したAPI

## Let Go

- **#1 resetGlobalTestState**: null→UnitManager() は意図的な逸脱。SkillInfoコンストラクタがg_appData.isDebugMenuEnabledにアクセスするため
- **#5 Performance**: テストユーティリティなので最適化不要
- **#6 atPosition null safety**: 全ファクトリメソッドがplacedTileを設定済み
- **#7/#8 テスト品質**: 基本動作確認で十分。後続セクションで強化予定
