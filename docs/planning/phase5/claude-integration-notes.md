# External Review Integration Notes

## 統合する提案

### 1. filterImportExport() の退避先を Sources/ から Tests/ に変更
**出典:** Gemini, OpenAI 両方
**理由:** `Sources/` はプロダクションコードのディレクトリ。テスト用のレガシーユーティリティを混入させるべきではない。本番バンドルに混ざるリスクもある。
**対応:** 退避先を `Tests/legacy/filterImportExport.js` に変更

### 2. import 順序の明確化 — TestGlobals.js を最上部に配置
**出典:** Gemini
**理由:** TestGlobals.js が side-effect として initUnitSkillEffects(Unit) を実行するため、他の import より先に評価される必要がある。
**対応:** Section B-1 に「TestGlobals.js の import を他の全 import より上に配置する」ルールを追加

### 3. グローバル参照の洗い出しをツール依存に変更
**出典:** Gemini, OpenAI
**理由:** 1016行の目視確認はヒューマンエラーの温床。Vitest のエラーメッセージや ESLint no-undef で機械的に検出すべき。
**対応:** Section B-3 を「テスト実行 → ReferenceError に基づく機械的な追加」アプローチに変更

### 4. 段階的な検証の許容
**出典:** OpenAI
**理由:** 「中間状態で部分テストしない」はデバッグ戦略として危険。変更は1コミットでも、ローカル検証は段階的に行うべき。
**対応:** Section C の検証手順を「ローカルでの段階的検証は推奨、コミットは1つの変更セットとして」に修正

### 5. 成功基準の補強
**出典:** OpenAI
**理由:** 「テストが通る」だけでは退行検知として弱い。連結方式の完全廃止を直接検証すべき。
**対応:** 成功基準に追加:
- プロジェクト内に `vm.runInThisContext` の使用がないことを grep で確認
- `DamageCalculator.test.js` に ESLint `no-undef` 違反がないこと

### 6. Section D の「任意」と成功基準の「必須」の矛盾解消
**出典:** OpenAI
**理由:** Section D のタイトルに「任意」とある一方、成功基準3で退避を必須としている。
**対応:** Section D を必須に統一（ユーザーが「残す」と回答しているため）

### 7. vitest.setup.js 削除前の責務監査
**出典:** OpenAI
**理由:** 「非連結の setup 処理は一切含まれていない」の断言に対する検証。削除前に責務棚卸しを明記すべき。
**対応:** Section A-2 に「削除前に責務を最終監査し、結果をコミットメッセージまたはPR説明に記録する」を追加

## 統合しない提案

### TestGlobals.js の API 化 (initializeTestEnvironment())
**出典:** OpenAI
**理由:** 51テストファイルが既に side-effect import パターンを使用しており、Section 12のスコープを超える大きな変更。現在のパターンで正常に動作中。将来の改善として別セクションで検討するのは有益だが、今回は対象外。

### TestGlobals.js の idempotency ガード追加
**出典:** OpenAI
**理由:** ESM モジュールは仕様上同一 URL で1回のみ評価される。`singleThread: true` を維持するため、worker間の再評価もない。vi.resetModules() は使用していない。

### singleThread: true の除去検討
**出典:** OpenAI
**理由:** Section 12のスコープ外。共有グローバル状態（g_testHeroDatabase等）が存在するため、当面は維持が安全。将来の最適化として別途検討可。

### prototype 拡張の composition 化
**出典:** OpenAI
**理由:** initUnitSkillEffects(Unit) のアーキテクチャ変更は Section 12のスコープを大幅に超える。現在正常に動作しており、連結廃止とは独立した改善項目。

### 構造テスト（instanceof検証等）の追加
**出典:** OpenAI
**理由:** HeroBattleTest（1391回）が既にこれらの構造的整合性を検証している。重複するテストを追加する必要はない。

### テストカバレッジ変動への言及
**出典:** Gemini
**理由:** CI にカバレッジ閾値は設定されていないため、実質的な影響はない。
