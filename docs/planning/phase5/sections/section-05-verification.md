Now I have all the context needed. Let me produce the section content.

# Section 05: 全変更適用後の段階的検証

## 概要

Section 01〜04 の全変更（vitest.setup.js 責務監査・filterImportExport 退避、連結方式の削除、DamageCalculator.test.js ESM化、SkillEffect.test.js ESM化）が適用された後に、テスト基盤全体の正常性を段階的に検証するセクション。

このセクションでは新規コードの作成は行わない。全ての変更が正しく動作していることを、段階的なテスト実行と grep ベースの静的検証で確認する。

## 前提条件（依存セクション）

以下のセクションが全て完了していること:

- **section-01-filter-evacuation** — `vitest.setup.js` の責務監査完了、`filterImportExport()` が `Tests/legacy/filterImportExport.js` に退避済み
- **section-02-concatenation-removal** — `vitest.setup.js` が削除済み、`vite.config.js` から `setupFiles` が除去済み
- **section-03-damagecalculator-esm** — `Tests/DamageCalculator.test.js` が ESM import のみで動作する状態
- **section-04-skilleffect-esm** — `Tests/SkillEffect.test.js` の未移行参照が全て ESM import に置換済み

## テスト（検証手順）

このセクションのテストは自動テストファイルの作成ではなく、手動での段階的検証コマンド実行である。

### 検証 1: DamageCalculator.test.js 単体実行

```bash
cd /Users/studio/Documents/GitHub/FehBattleSimulator
npx vitest run Tests/DamageCalculator.test.js
```

**確認事項:**
- `ReferenceError: xxx is not defined` が一切発生しないこと
- `DamageCalculator_HeroBattleTest` の 1391 回全英雄戦闘テストがパスすること
- `TypeError: _targetNode.evaluate is not a function` が発生しないこと（二重世界問題の解消確認）
- `instanceof` チェックが正しく動作すること

HeroBattleTest はスキル効果ノードの `instanceof` チェック、side-effect 登録の完全性、`initUnitSkillEffects(Unit)` によるプロトタイプ拡張の全てに依存するため、ESM 移行の成否を最も鋭敏に検出する。

**失敗時のデバッグ:**
1. **ノード同一性依存** — ESM 版とグローバル版でクラスオブジェクトが別になっていないか確認。連結方式が完全に廃止されていれば二重世界は解消されるはず
2. **side-effect 登録順** — `SkillImpl*.js` の import 順序が期待通りか。`TestGlobals.js` が全ての SkillImpl を import しているか確認
3. **initUnitSkillEffects(Unit) の適用順** — `TestGlobals.js` での呼び出しが全ての SkillImpl import の後に実行されているか

### 検証 2: SkillEffect.test.js 単体実行

```bash
cd /Users/studio/Documents/GitHub/FehBattleSimulator
npx vitest run Tests/SkillEffect.test.js
```

**確認事項:**
- `ReferenceError` が発生しないこと
- `g_testHeroDatabase` が `TestGlobals.js` の named import で正しく取得できていること
- `test_DamageCalculator` が `TestUtilities.js` から正しく import されていること
- 全テストケースがパスすること

### 検証 3: 全体テスト実行

```bash
cd /Users/studio/Documents/GitHub/FehBattleSimulator
npm run test:only
```

**確認事項:**
- 全 52 テストファイルが通過すること（`Performance.test.js` の環境依存閾値超過は許容。連結方式とは無関係）
- 全体実行時に、単独実行では出なかった失敗が発生しないこと

**テスト間状態汚染（State bleed）について:** ESM モジュールは全テスト間でシングルトンとなるため、あるテストでのミューテーションが次のテストに影響する可能性がある。全体実行でのみ失敗するテストが出た場合はこれを疑う。

### 検証 4: WARN: Non-TDZ ReferenceError の確認

全体テスト実行の出力を確認し、以下の警告が含まれていないことを確認する:

```
WARN: Non-TDZ ReferenceError
```

**警告が消えない場合の切り分け手順:**
1. `vitest.setup.js` が完全に削除されているか確認（`setupFiles` 設定の残存も含む）
2. `TestGlobals.js` / `SkillImpl*` / `initUnitSkillEffects(Unit)` の評価順序に問題がないか確認
3. 例外を握りつぶして warning にしている箇所を特定する:

```bash
cd /Users/studio/Documents/GitHub/FehBattleSimulator
# grep で Non-TDZ や ReferenceError を検索
```

Grep ツールで以下のパターンを検索:
- パターン: `Non-TDZ` — プロジェクト全体
- パターン: `ReferenceError` — `Sources/` および `Tests/` ディレクトリ

### 検証 5: 連結方式の完全廃止確認

以下の静的検証を grep ベースで実行する。

**5a: vm.runInThisContext の使用がないこと**

Grep ツールでパターン `vm\.runInThisContext` をプロジェクト全体で検索する。`Tests/legacy/filterImportExport.js` 以外にヒットしないことを確認。（退避ファイル内のコメントや JSDoc にこの文字列が含まれる場合は許容。実行コードとしての使用がないことが重要。）

**5b: vitest.setup.js が存在しないこと**

Glob ツールでパターン `**/vitest.setup.js` を検索し、ファイルが存在しないことを確認する。

**5c: vite.config.js に setupFiles 設定がないこと**

Grep ツールでパターン `setupFiles` を `/Users/studio/Documents/GitHub/FehBattleSimulator/vite.config.js` で検索し、ヒットしないことを確認する。

**5d: DamageCalculator.test.js に ESLint no-undef 違反がないこと**

```bash
cd /Users/studio/Documents/GitHub/FehBattleSimulator
npx eslint Tests/DamageCalculator.test.js
```

ESLint の `no-undef` ルールで未定義変数の参照がないことを確認する。

**5e: filterImportExport.js の退避確認**

Glob ツールで `Tests/legacy/filterImportExport.js` が存在することを確認する。また、`Sources/` ディレクトリ内に `filterImportExport` 関連のファイルがないことを Grep ツールで確認する（プロダクションコードへの混入防止）。

## 実装手順

このセクションではコード変更は行わない。上記の検証 1〜5 を順番に実行し、全て通過することを確認する。

### 全検証通過後のアクション

全ての検証が通過した場合:

1. Section 01〜04 の変更を含むコミットを作成（または各セクションで個別コミット済みの場合はそのまま）
2. コミットメッセージに以下を含める:
   - vitest.setup.js の責務監査結果（連結処理以外の機能がなかったこと）
   - 連結方式の廃止が完了したこと
   - HeroBattleTest 1391 回パスの確認
   - `WARN: Non-TDZ ReferenceError` 警告の解消状況

### 検証失敗時のアクション

いずれかの検証が失敗した場合:

1. 失敗した検証のステップと具体的なエラーメッセージを記録する
2. 上記のデバッグガイドに従い原因を切り分ける
3. 該当セクション（section-02, section-03, section-04 のいずれか）に戻って修正を行う
4. 修正後、検証 1 から再度実行する

## 成功基準チェックリスト

以下の全項目が満たされていることを最終確認する:

- [x] `vitest.setup.js` が削除されている
- [x] `vite.config.js` から `setupFiles` 設定が除去されている
- [x] `filterImportExport()` が `Tests/legacy/filterImportExport.js` に退避されている
- [x] `DamageCalculator.test.js` が ESM import のみで動作する（未定義グローバル参照がない）
- [x] `SkillEffect.test.js` の未移行参照が全て ESM import に置換されている
- [x] `npm run test:only` で全54テストファイル・650テストが通過（Performance.test.js 含む全テストパス）
- [x] `WARN: Non-TDZ ReferenceError` 警告が出ない
- [x] `DamageCalculator_HeroBattleTest`（1391 回の全英雄戦闘テスト）がパスする（4210ms）
- [x] プロジェクト内に `vm.runInThisContext` の実行コードとしての使用がないことが grep で確認されている

## 検証実施日

2026-03-27 — 全検証項目通過確認済み

## 対象ファイル

このセクションでは新規作成・変更するファイルはない。以下のファイルを検証対象として参照する:

| ファイル | 検証内容 |
|---------|---------|
| `vitest.setup.js` | 存在しないことの確認 |
| `vite.config.js` | `setupFiles` が除去されていること |
| `Tests/DamageCalculator.test.js` | ESM import のみで動作すること |
| `Tests/SkillEffect.test.js` | 未移行参照が解消されていること |
| `Tests/legacy/filterImportExport.js` | 退避ファイルが存在すること |