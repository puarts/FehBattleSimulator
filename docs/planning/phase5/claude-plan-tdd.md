# Section 12: TDD Plan — vitest.setup.js 連結方式廃止

## テスト環境

- **フレームワーク:** Vitest
- **環境:** jsdom
- **テストファイル:** `Tests/**/*.test.js`
- **実行:** `npm run test:only` (vitest run)
- **設定:** `vite.config.js` の `test` セクション（`singleThread: true`）

## Section A: vitest.setup.js の削除と vite.config.js の更新

### テスト: 責務監査の確認

```
# Test: vitest.setup.js に連結処理以外の処理が含まれていないことを確認
# Test: filterImportExport() 以外に退避が必要な関数やデータがないことを確認
```

### テスト: setupFiles 除去後の動作

```
# Test: vite.config.js から setupFiles を除去した後、Vitest が正常に起動すること
# Test: setupFiles 除去により既存の51 ESM化済みテストが影響を受けないこと
# Test: globals: true が引き続き describe/test/expect をグローバルに提供すること
```

## Section B: DamageCalculator.test.js のESM化

### テスト: import の完全性

```
# Test: DamageCalculator.test.js に ReferenceError（未定義変数）が発生しないこと
# Test: g_testHeroDatabase が TestGlobals.js の named import で正しく取得できること
# Test: test_DamageCalculator, test_calcDamage, test_createDefaultUnit, test_executeTest が TestUtilities.js から正しく import されること
# Test: Unit クラスが Unit.js から正しく import されること
```

### テスト: HeroBattleTest

```
# Test: DamageCalculator_HeroBattleTest の1391回全英雄戦闘テストがパスすること
# Test: instanceof チェックが正しく動作すること（二重世界問題の解消確認）
# Test: SkillEffectNode の evaluate メソッドが正常に呼び出されること
```

### テスト: 既存テストケースの維持

```
# Test: DamageCalculator.test.js 内の全47 describe/test ブロックが引き続きパスすること
# Test: ESM化により意味的な変更がないこと（テスト結果が同一であること）
```

## Section B2: SkillEffect.test.js の完全ESM化

### テスト: 未移行参照の解消

```
# Test: SkillEffect.test.js に ReferenceError（未定義変数）が発生しないこと
# Test: g_testHeroDatabase が TestGlobals.js の named import で正しく取得できること
# Test: test_DamageCalculator が TestUtilities.js から正しく import されること
# Test: globalThis.g_appData の使用が適切に処理されていること
```

### テスト: 既存テストケースの維持

```
# Test: SkillEffect.test.js 内の全テストケースが引き続きパスすること
```

## Section C: 検証とデバッグ

### テスト: 全体テスト通過

```
# Test: npm run test:only で全52テストファイルが通過すること（Performance.test.js の環境依存閾値を除く）
# Test: DamageCalculator.test.js 単独実行で全テストがパスすること
# Test: SkillEffect.test.js 単独実行で全テストがパスすること
```

### テスト: 警告の解消

```
# Test: テスト実行出力に WARN: Non-TDZ ReferenceError が含まれないこと
```

### テスト: 連結方式の完全廃止確認

```
# Test: プロジェクト全体で vm.runInThisContext の使用がないこと（grep 検証）
# Test: vitest.setup.js が存在しないこと
# Test: vite.config.js に setupFiles 設定がないこと
```

### テスト: テスト間状態汚染の確認

```
# Test: 全体テスト実行時に、単独実行では出なかった失敗が発生しないこと
# Test: テスト実行順序の変更（--shuffle等）で新たな失敗が出ないこと（任意）
```

## Section D: filterImportExport() の退避

### テスト: 退避の確認

```
# Test: Tests/legacy/filterImportExport.js が存在し、filterImportExport 関数が export されていること
# Test: 退避された関数が元の vitest.setup.js 版と同一の動作をすること
# Test: Sources/ ディレクトリに filterImportExport 関連のファイルがないこと（プロダクションコードへの混入防止）
```
