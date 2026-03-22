Now I have all the context I need. Let me generate the section content.

# Section 9: vitest.setup.js の廃止 -- テストファイルのESM import直接化

## 概要

このセクションでは、現在の `vitest.setup.js` が行っている `vm.runInThisContext` による全ソースファイル連結評価方式を廃止し、各テストファイルが ESM の `import` 文を直接使用してソースモジュールにアクセスする方式に切り替える。

セクション1-8が完了した前提で作業する。すなわち:
- 循環依存がゼロ（セクション1-6）
- `AppDataGlobal.js` が存在し、`g_appData` がESMモジュールとしてexport/import可能（セクション7）
- 全ソースファイルに不足importが追加済み（セクション8）

## 依存セクション

- **section-08-missing-imports**: 全ソースファイルのimportが完備されていること（前提条件）
- **section-07-appdata-module**: `AppDataGlobal.js` の `g_appData` / `setAppData()` が利用可能であること

## 現状

### vitest.setup.js の仕組み

ファイル: `/Users/studio/Documents/GitHub/FehBattleSimulator/vitest.setup.js`

現在の `vitest.setup.js` は以下を行っている:

1. `SOURCE_FILE_NAMES` 配列に定義された43ファイルを順番に読み込む
2. 各ファイルの `import` / `export` 行を正規表現で除去する
3. 全ファイルを連結し、`vm.Script` + `runInThisContext()` でグローバルスコープとして評価する
4. `Tests/TestGlobals.js` も同様に連結して評価する

これにより、テストファイルはimport文なしで `NumberNode`, `CONSTANT_NUMBER_NODE`, `Unit`, `SkillInfo` などのシンボルに直接アクセスできている。

### テストファイルの現状

テストファイル（例: `Tests/SkillEffect.test.js`）にはimport文が一切なく、グローバルスコープ上のシンボルを直接参照している:

```javascript
// Tests/SkillEffect.test.js 冒頭 -- import文なし
describe('Test skill effect', () => {
    describe(`Test ${NumberNode.name}`, () => {
        test('mult function', () => {
            expect(CONSTANT_NUMBER_NODE(2).mult(4).evaluate(new NodeEnv())).toBe(8);
        });
```

### vite.config.js のテスト設定

ファイル: `/Users/studio/Documents/GitHub/FehBattleSimulator/vite.config.js`

```javascript
test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.js'],
    root: './',
    include: ['Tests/**/*.test.js'],
    exclude: ['**/All.test.js', '**/node_modules/**'],
    pool: 'threads',
    singleThread: true,
},
```

- `globals: true` -- `describe`, `test`, `expect` 等をimportなしで使用
- `singleThread: true` -- テスト間でグローバル状態を共有（連結方式のため必要だった）

### TestGlobals.js と TestUtilities.js

- `Tests/TestGlobals.js`: テスト用のヘルパークラス（`test_HeroDatabase`, `test_UnitManager`）を定義。import文なし（連結評価で動作）
- `Sources/TestUtilities.js`: テストユーティリティ関数群。既にESM import文を持つ（`import { Weapon, ... } from './SkillConstants.js'` 等）

---

## テスト（TDD）

以下のテストを先に作成・確認してから実装を進める。

### Test 1: テストファイルがESM importで直接モジュールにアクセスできる

テストファイルの先頭にimport文を追加し、ソースモジュールから直接シンボルを取得できることを確認する。

```javascript
// Tests/EsmImportSanity.test.js（新規作成、移行の動作確認用）
import { NumberNode, NodeEnv } from '../Sources/SkillEffectCore.js';
import { CONSTANT_NUMBER_NODE } from '../Sources/SkillEffectEnv.js';

describe('ESM import sanity check', () => {
    test('can import and use SkillEffectCore symbols directly', () => {
        expect(CONSTANT_NUMBER_NODE(2).mult(4).evaluate(new NodeEnv())).toBe(8);
    });
});
```

### Test 2: vm.runInThisContext 削除後も全テストがパスする

`vitest.setup.js` から `SOURCE_FILE_NAMES` と `vm.runInThisContext` 部分を削除し、全テストがESM importのみでパスすることを確認する。

### Test 3: g_appData がbeforeEachでクリーンにリセットされる

```javascript
// テスト間の状態汚染がないことを確認
// テストファイル内のbeforeEachでg_appDataをリセットするパターン
import { g_appData, setAppData } from '../Sources/AppDataGlobal.js';

describe('g_appData isolation', () => {
    beforeEach(() => {
        // g_appDataを新規インスタンスでリセット
        // 具体的なリセット方法はAppDataのコンストラクタに依存
        setAppData(null);
    });

    test('g_appData starts clean in each test', () => {
        expect(g_appData).toBeNull();
    });
});
```

### Test 4: 2つのテストが同じグローバル状態を変更しても互いに影響しない

ESMモジュールキャッシュにより、モジュールレベルの変数が共有される問題に対処できていることを確認する。

### Test 5: テスト実行時にOOMが発生しない

`npm run test:only` が正常に完了し、メモリ不足エラーが出ないことを確認する。pool設定の調整が必要な場合がある。

---

## 実装手順

### ステップ1: パイロットテストで直接import方式を試行

まず1-2個のテストファイルで直接import方式が動作することを確認する。

1. `Tests/EsmImportSanity.test.js`（新規）を作成し、基本的なESM importでテストが動作することを確認する
2. 既存テストファイル（例: `Tests/SkillEffect.test.js`）の先頭にimport文を追加し、`vitest.setup.js` の連結評価と併存できることを確認する

パイロットで確認すべき点:
- ESM importでシンボルが正しく解決される
- `vitest.setup.js` のグローバル汚染と ESM import が競合しない
- テスト実行速度に大きな劣化がない

### ステップ2: 全テストファイルにimport文を追加

各テストファイルで使用されているシンボルを特定し、適切なimport文を追加する。

**修正対象ファイル群**: `Tests/` 配下の全 `.test.js` ファイル

**作業パターン**:
1. テストファイル内で参照されているシンボル（クラス名、関数名、定数名）を列挙する
2. 各シンボルの定義元ソースファイルを特定する（セクション8で追加したimportマッピングを参考にする）
3. テストファイルの先頭にimport文を追加する
4. `Tests/TestGlobals.js` の内容もESM化する -- import文を追加し、ヘルパークラスをexportする。テストファイル側で `import { test_HeroDatabase, test_UnitManager } from './TestGlobals.js'` のように利用する

**TestGlobals.js の修正例**:

```javascript
// Tests/TestGlobals.js -- ESM化
import { HeroDatabase } from '../Sources/HeroDatabase.js';
import { UnitManager } from '../Sources/UnitManager.js';
// ... 必要なimportを追加

export class test_HeroDatabase extends HeroDatabase { ... }
export class test_UnitManager extends UnitManager { ... }
export const g_testHeroDatabase = new test_HeroDatabase(...);
```

### ステップ3: vitest.setup.js の縮小

全テストファイルが直接importで動作することを確認した後、`vitest.setup.js` を以下のように縮小する。

**削除する部分**:
- `SOURCE_FILE_NAMES` 配列
- `TEST_UTIL_FILE_NAMES` 配列
- `filterImportExport()` 関数
- `vm.Script` / `runInThisContext()` による連結評価コード
- `import fs`, `import path`, `import vm` （不要になった場合）

**残す可能性がある部分**:
- グローバルな初期化処理（jsdom環境のセットアップ等）がもしあれば残す
- `g_appData` のグローバルリセット処理を `beforeEach` グローバルフックとして追加する可能性がある

縮小後の `vitest.setup.js` は空ファイルまたは最小限の初期化のみとなる。完全に不要であれば削除し、`vite.config.js` の `test.setupFiles` からも除去する。

### ステップ4: vite.config.js の更新

ファイル: `/Users/studio/Documents/GitHub/FehBattleSimulator/vite.config.js`

以下の変更を行う:

1. **`test.setupFiles`**: `vitest.setup.js` を削除するか、グローバルリセットのみのsetupファイルに変更する
2. **`test.singleThread`**: 連結方式が廃止されたため `singleThread: true` は不要になる可能性がある。ただし、ESMモジュールキャッシュによる状態共有の問題が残る場合は維持する
3. **`test.pool`**: パフォーマンスに応じて `'forks'` への変更を検討する

```javascript
// vite.config.js のtest部分（修正後の例）
test: {
    globals: true,
    environment: 'jsdom',
    // setupFiles を削除 or 最小限に
    // setupFiles: ['./vitest.setup.js'],
    root: './',
    include: ['Tests/**/*.test.js'],
    exclude: ['**/All.test.js', '**/node_modules/**'],
    // pool/singleThread はパフォーマンステスト結果に基づいて調整
    pool: 'forks',  // OOM対策としてforksを検討
},
```

### ステップ5: g_appData の状態汚染対策

ESMモジュールはVitestのワーカー内でキャッシュされるため、テスト間で `g_appData` の状態が共有（Bleeding）される。

**対策方法**:

1. **グローバルsetupファイルでの `beforeEach`**: `vitest.setup.js`（または新しいsetupファイル）にグローバルな `beforeEach` を追加し、毎テスト前に `setAppData(null)` または新規インスタンスでリセットする

2. **各テストファイルの `beforeEach`**: テストファイルごとに `beforeEach` で必要なg_appData初期化を行う（テストファイルの独立性が高まるが、ボイラープレートが増える）

推奨は方法1（グローバルsetupでのリセット）。最小限のsetupファイルを残す形:

```javascript
// vitest.setup.js（縮小版）
import { setAppData } from './Sources/AppDataGlobal.js';

beforeEach(() => {
    setAppData(null);
});
```

### ステップ6: パフォーマンス確認と調整

500テストファイルが各々ESM importすると、モジュールグラフの再パースでメモリ使用量が増大する可能性がある。

**確認項目**:
- `npm run test:only` が正常完了する（OOMなし）
- テスト実行時間がベースライン（連結方式）から大幅に劣化しない
- メモリ使用量が許容範囲内

**調整オプション**（問題が発生した場合のみ）:
- `pool: 'forks'` -- プロセスフォーク方式に切り替え。各ワーカーが独立メモリを持つためOOMリスクが低減する
- `isolate: false` -- テスト間のモジュール状態リセットを無効化する一時的緩和策。状態汚染のリスクがあるため最終手段とする
- `poolOptions.forks.maxForks` / `poolOptions.threads.maxThreads` でワーカー数を制限する

---

## 実装結果（ハイブリッド方式）

### 達成した内容
- 16個のレガシーテストファイルにESM import文を追加（enum/定数のみ）
- `Tests/EsmImportSanity.test.js`（新規）でESM importの動作を検証
- `vitest.setup.js` にTODOコメントで残課題を記録

### 達成できなかった内容（循環依存によるブロック）
以下の循環依存が発見され、完全なESM移行がブロックされた:
1. `SkillEffect.js ↔ SkillEffectUnit.js` — クラス階層がモジュール評価時に循環
2. `SkillEffect.js ↔ SkillEffectField.js` — `SingleEffectNode`経由の循環
3. `SkillImpl*`ファイル群 — 連結グローバルに依存する数百のシンボル未import

これらの解消には SkillEffect* モジュール群の大規模リファクタリングが必要であり、別途 deep-plan で対応する。

### 未達成の元計画の成功条件
- ~~`vitest.setup.js` の連結方式廃止~~ → 連結を維持
- ~~`vite.config.js` 更新~~ → 変更なし
- ~~`TestGlobals.js` ESM化~~ → 連結に依存
- ~~`g_appData` 状態汚染対策~~ → 完全ESM化に依存

## 変更対象ファイル一覧（実際）

| ファイル | 変更内容 |
|----------|---------|
| `vitest.setup.js` | TODOコメント追加（連結方式は維持） |
| `Tests/EsmImportSanity.test.js` (新規) | ESM importパイロットテスト |
| `Tests/*.test.js` (16ファイル) | enum/定数のESM import文を追加 |