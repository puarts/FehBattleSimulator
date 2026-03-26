Now I have all the context I need. Let me generate the section content.

# Section 01: vitest.setup.js の責務監査と filterImportExport() 退避

## 概要

このセクションでは、vitest.setup.js を削除する前準備として2つの作業を行う:

1. **責務監査** -- vitest.setup.js に連結処理以外の処理が含まれていないかを確認する
2. **filterImportExport() 関数の退避** -- ユーザー要望により `Tests/legacy/filterImportExport.js` へ関数を保存する

このセクションは他セクションに対する依存がなく、最初に実行する。完了後、section-02 (連結方式の削除) がこのセクションに依存して進行する。

## 背景

### vitest.setup.js の現在の構造

ファイルパス: `/Users/studio/Documents/GitHub/FehBattleSimulator/vitest.setup.js`

vitest.setup.js は以下の要素で構成されている:

1. **Node.js モジュール import** -- `fs`, `path`, `vm` の3つ
2. **`SOURCE_FILE_NAMES` 配列** -- 連結対象の33以上のソースファイル名を列挙
3. **`TEST_UTIL_FILE_NAMES` 配列** -- `['TestGlobals']` のみ
4. **`filterImportExport(content)` 関数** -- ESM の import/export 文をストリップして連結実行可能にする変換関数
5. **メイン処理** -- ファイル読み込み → filterImportExport 適用 → `vm.Script` → `vm.runInThisContext()` → `initUnitSkillEffects(Unit)` 呼び出し

連結処理以外の機能（polyfill、console抑制、共通フック等）は含まれていない。jsdom環境設定は `vite.config.js` の `environment: 'jsdom'` で完結しており、`globals: true` により Vitest の `describe/test/expect` は自動的にグローバル利用可能。

### filterImportExport() 関数の動作

この関数は文字列として読み込んだJSソースコードから import/export 文を除去する:

- 単行 import 文 (`import ... from '...'`) を完全にスキップ
- 複数行 import 文 (`import {\n...\n} from '...'`) を検出し、閉じるまでスキップ
- `export { ... }` 行をスキップ
- `export function/class/const/let/var` の `export` キーワードだけを除去

## テスト仕様

### テスト1: filterImportExport 関数の退避確認

ファイル: `/Users/studio/Documents/GitHub/FehBattleSimulator/Tests/legacy/filterImportExport.test.js` (新規作成)

以下の観点をテストする:

- `Tests/legacy/filterImportExport.js` が存在し、`filterImportExport` 関数が named export されていること
- 単行 import 文が除去されること
- 複数行 import 文が除去されること
- `export { ... }` 行が除去されること
- `export function/class/const/let/var` の export キーワードのみが除去され、宣言部分は残ること
- 通常のコード行は変更されないこと
- `Sources/` ディレクトリに filterImportExport 関連ファイルがないこと (プロダクションコードへの混入防止)

テストのスタブ:

```javascript
// Tests/legacy/filterImportExport.test.js
import { describe, test, expect } from 'vitest';
import { filterImportExport } from './filterImportExport.js';

describe('filterImportExport', () => {
    test('単行 import 文を除去する', () => {
        // import ... from '...' 形式の行が結果に含まれないこと
    });

    test('複数行 import 文を除去する', () => {
        // import {\n  ...\n} from '...' 形式の複数行が結果に含まれないこと
    });

    test('export { } 行を除去する', () => {
        // export { Foo, Bar } 形式の行が結果に含まれないこと
    });

    test('export キーワードのみ除去し宣言は残す', () => {
        // "export function foo()" → "function foo()"
        // "export class Bar" → "class Bar"
        // "export const X" → "const X"
    });

    test('通常のコード行は変更しない', () => {
        // import/export 以外の行はそのまま残ること
    });
});
```

### テスト2: 責務監査 -- 連結処理以外が含まれないことの確認

これは手動確認項目であり、自動テストではなくコミットメッセージまたはPR説明に記録する。確認事項:

- vitest.setup.js に連結処理以外の処理（polyfill、グローバル変数初期化、console抑制、共通フック等）が含まれていないこと
- `filterImportExport()` 以外に退避が必要な関数やデータがないこと

## 実装手順

### Step 1: vitest.setup.js の責務監査

`/Users/studio/Documents/GitHub/FehBattleSimulator/vitest.setup.js` を読み、以下を確認する:

- ファイルの全88行を精読し、連結処理（ファイル読み込み + filterImportExport + vm.runInThisContext）以外の処理がないことを確認
- 現時点の分析では連結処理のみが含まれており、非連結処理は発見されていない
- もし非連結処理が発見された場合は、適切な場所への移動をこのセクション内で実施する

監査結果はコミットメッセージに記録する。

### Step 2: Tests/legacy/ ディレクトリの作成

```
Tests/legacy/
```

このディレクトリを新規作成する。レガシーなテストユーティリティの隔離先として使用する。

### Step 3: filterImportExport() 関数の退避

新規ファイル: `/Users/studio/Documents/GitHub/FehBattleSimulator/Tests/legacy/filterImportExport.js`

以下の要件で作成する:

- vitest.setup.js から `filterImportExport` 関数をそのままコピー
- 関数のシグネチャと動作を一切変更しない
- `export` を付けて named export する
- JSDoc コメントで経緯を記録:
  - 旧 vitest.setup.js の連結方式で使用されていた関数であること
  - Phase 5 Section 12 で連結廃止後に退避されたこと
  - import/export 文をストリップして連結実行可能にする変換関数であること

関数の実装内容 (vitest.setup.js 40-67行目からそのまま移植):

- `content` (文字列) を受け取り、行ごとに走査
- `inMultiLineImport` フラグで複数行 import の範囲を追跡
- `import` で始まる行を検出し、単行か複数行かを判定してスキップ
- `export { }` 行をスキップ
- `export function/class/const/let/var` の行から `export ` を除去
- 処理済みの行を結合して返す

### Step 4: テストファイルの作成と実行

新規ファイル: `/Users/studio/Documents/GitHub/FehBattleSimulator/Tests/legacy/filterImportExport.test.js`

上記「テスト仕様」に基づくテストを作成し、以下のコマンドで実行して全テストがパスすることを確認:

```bash
npx vitest run Tests/legacy/filterImportExport.test.js
```

## 変更対象ファイル

| ファイル | 操作 |
|---------|------|
| `Tests/legacy/filterImportExport.js` | 新規作成 |
| `Tests/legacy/filterImportExport.test.js` | 新規作成 |

**注意:** このセクションでは vitest.setup.js の削除は行わない。削除は section-02 (連結方式の削除) で実施する。

## 依存関係

- **前提:** なし (最初に実行するセクション)
- **後続:** section-02 (vitest.setup.js の削除と vite.config.js の更新) がこのセクションの完了に依存する

## 完了基準

1. vitest.setup.js の責務監査が完了し、連結処理以外の機能がないことが確認されている
2. `Tests/legacy/filterImportExport.js` が作成され、`filterImportExport` 関数が正しく export されている
3. `Tests/legacy/filterImportExport.test.js` のテストが全てパスする
4. `Sources/` ディレクトリに filterImportExport 関連ファイルがない
5. 既存テスト (`npm run test:only`) に影響がない (新規ファイル追加のみであるため)

## 実装結果

- **責務監査:** vitest.setup.js (88行) は連結処理のみで構成。polyfill・console抑制・共通フック等の非連結処理は含まれていなかった
- **JSDoc:** プラン記載の "Phase 5 Section 12" ではなく、より正確な "Phase 5 Section 01" と記載
- **テスト:** プラン記載の5テストに加え、副作用のみの import (`import './setup.js'`) のテストを追加（計7テスト、全パス）
- **既存テスト:** Performance.test.js の既知のフレーク（タイミング閾値）以外は全パス（53/54ファイル、649/650テスト）
- **コードレビュー:** Sources/ スキャンの再帰化は見送り（Sources/ はフラット構造のため）