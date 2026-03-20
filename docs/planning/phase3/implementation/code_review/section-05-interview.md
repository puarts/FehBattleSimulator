# Code Review Interview: section-05-dev-server

## Interview Decisions

### #1-2: import.meta.env dev/prod分岐 (HIGH)
**Decision**: 現状維持。section-02で*Main.jsが既にSampleSkillInfos.js等から直接importしており、dev/prodともバンドルデータを使用する設計。import.meta.env分岐は不要。.envファイルは将来の拡張用に残す。

### #3-4: HTML cleanup / initialization migration (MEDIUM)
**Decision**: section-02で完了済み。ドキュメントに記載する。

### #7: Test coverage gap (MEDIUM)
**Decision**: Let go。import.meta.env実行時テストはVite起動が必要で自動テストには不向き。静的チェック（.envファイル存在＋HTML構造）で十分。

## Auto-fixes Applied

### #5: Unused glob import
Removed `import { glob } from 'glob'` from DevServerHtml.test.js.

## Let Go

### #6: Inconsistent vitest imports
globals: true がプロジェクト規約。既存テストと一貫性あり。

### #8: Minimal server config
plan記載のproxy/port設定はオプション。cors: trueのみで十分。
