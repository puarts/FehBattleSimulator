# Code Review Interview: Section 04 - ディレクトリ構成設計

## Triage Summary

### Asked User (real tradeoff)
- **ロード順序とクロスディレクトリ分析の追加**: レビューで指摘された2点（initialization-rootのロード順序維持、クロスディレクトリ依存エッジ数分析）について対応方針を確認
  - **ユーザー判断**: 両方対応。理由:
    - create_tests.shの順序は実動作に直結し、「移動だけ」で壊しやすい → 明文化必要
    - 39ファイルSCCを8ディレクトリに切る根拠として定量情報が必要 → 最小限の補強
  - **実施内容**:
    1. ロード順序の維持ルールを設計書に追加（「相対パスのみ更新、相対順序は維持」）
    2. クロスディレクトリ依存エッジ数テーブルを設計書に追加（全体内部率16%、分析コメント付き）

### Auto-fix (applied)
- なし

### Let Go (nitpicks)
- **PostCombatSkillHander.jsのtypo**: 実ファイル名のtypo（Handler→Hander）。リネームはファイル移動セクション（section-05）で検討可能だが、本設計セクションのスコープ外
- **Deploy.bat/MergeSourcesAndCompress.batのパス検証**: section-05で実際に移動する際に検証（設計段階では未確認でOK）
- **バッチ順序根拠の弱さ**: SCC内のバッチ順序は機能ドメイン順であり、依存レイヤー順ではない。設計書の記述は適切
- **ロールバック計画**: 各バッチはgit mvなのでgit revertで対応可能。明示的なドキュメント化は不要

## Applied Changes
1. `docs/planning/esm-migration/directory-design.md`: ロード順序の維持ルール + クロスディレクトリ依存分析テーブルを追加

## Verification
- 設計ドキュメントのため、テスト実行は不要
- 全64ファイルのディレクトリ割り当てに漏れなし（合計確認済み）
