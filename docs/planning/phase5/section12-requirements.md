# Section 12: vitest.setup.js 連結方式廃止 — 要件定義

## 目的

`vitest.setup.js` の `vm.runInThisContext` による連結実行方式を廃止し、全テストファイルがESM importのみで動作する状態を実現する。

## 背景

Phase 5のSection 01〜11で以下が完了済み:
- 循環依存の解消（madge検証: 0件）
- 全ソースファイルのESM export完備
- 52テストファイル中51ファイルのESM import化
- `Tests/TestGlobals.js` のESM化（`setTestHeroDatabase()` / `getTestHeroDatabase()` 依存注入パターン）

### 現在の連結方式（廃止対象）

`vitest.setup.js` が以下を行っている:
1. 33個のSourceファイル + `Tests/TestGlobals.js` を `fs.readFileSync` で読み込み
2. `filterImportExport()` で import/export 文をストリップ
3. `vm.runInThisContext()` でグローバルスコープに連結実行
4. 連結後に `initUnitSkillEffects(Unit)` を呼び出し

### ESM/連結 二重世界問題

`TestGlobals.js` がESM化されて `SkillImpl*.js` をESM importする一方、`vitest.setup.js` が同じファイルを連結実行するため、スキル効果ノードクラスが2つのコンテキストに存在する。

- ESM版 `SkillEffectNode` と連結版 `SkillEffectNode` が別クラスオブジェクト
- `instanceof` チェックが失敗し `TypeError: _targetNode.evaluate is not a function` が発生
- この問題のため `DamageCalculator.test.js` は連結版グローバルを使用中（唯一の未ESM化テスト）

**連結方式を廃止すれば二重世界は自動解消される。**

## 現在のテスト状況

```
Test Files: 52 passed, 1 failed (Performance.test.js — 環境依存の閾値超過、連結とは無関係)
Tests: 642 passed, 1 failed
```

## 対象ファイル

### 主要変更対象

| ファイル | 現在の状態 | 必要な変更 |
|---------|----------|-----------|
| `vitest.setup.js` | 33+1ファイルを連結実行 | 連結処理を削除、ESM setup に置換 |
| `Tests/DamageCalculator.test.js` | 連結版グローバル参照（`g_testHeroDatabase`, `test_DamageCalculator` 等をimportなしで使用） | ESM importを追加 |

### 参照ファイル（変更不要だが理解が必要）

| ファイル | 役割 |
|---------|------|
| `Tests/TestGlobals.js` | ESM化済みハブ。SkillImpl*.jsをside-effect import、`g_testHeroDatabase` をexport |
| `Sources/TestUtilities.js` | `UnitBuilder`, `test_DamageCalculator`, `setTestHeroDatabase()` 等をexport |
| `Sources/UnitSkillEffect.js` | `initUnitSkillEffects(Unit)` をexport |

## 技術的制約

1. **循環依存なし** — madge検証済み、ESM importで問題なく動作する
2. **export漏れなし** — Section 05で全シンボルのexport追加済み
3. **TestGlobals.js の初期化順序** — ESM module evaluation orderに依存（現在正常動作中）
4. **`filterImportExport` 関数** — 連結廃止後は不要になるが、一応残しておいてもよい
5. **`WARN: Non-TDZ ReferenceError`** — 現在出力されている警告。連結廃止で消える可能性あり

## 成功基準

1. `vitest.setup.js` から `vm.runInThisContext` 連結処理が完全に除去されている
2. `filterImportExport` 関数が不要になり削除されている
3. `DamageCalculator.test.js` がESM importのみで動作する
4. `npm run test:only` で全テストが通過する（Performance.test.jsの環境依存閾値を除く）
5. `WARN: Non-TDZ ReferenceError` 警告が消えている
6. `DamageCalculator_HeroBattleTest`（1391回の全英雄戦闘テスト）がパスする

## リスク

- **低リスク**: vitest.setup.js の連結を単純に削除すると、一部テストが暗黙的にグローバル変数を参照している可能性がある → Section 11で51ファイルがESM化済みのため、残りは1ファイルのみ
- **低リスク**: initUnitSkillEffects(Unit) の呼び出しタイミング → TestGlobals.jsで既に対応済み
- **注意**: vitest.setup.js を完全に空にするのではなく、jsdom環境設定など非連結の設定は残す必要がある可能性

## 参考: 関連セクション文書

- `docs/planning/phase5/sections/section-11-test-esm.md` — Section 11の実装結果と既知の制約
- `docs/planning/phase5/sections/section-01-investigation.md` — 連結方式の詳細調査
