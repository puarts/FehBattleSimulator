Now I have enough context. Let me generate the section content.

# Section 1: 事前調査と検証環境構築

## 概要

Phase 5の作業開始前に、SkillEffect DSLモジュール群（約20,000行）の現状を正確に把握し、安全に作業を進めるための検証基盤を構築する。このセクションは調査とベースラインテスト作成が主な成果物であり、後続の全セクション（02〜14）がこの調査結果に依存する。

## 背景

Phase 4で47ファイル間のレイヤー違反的な循環依存は解消済み。しかしSkillEffect DSLモジュール群には、`vitest.setup.js`の`vm.runInThisContext`連結実行によって見えにくくなっている暗黙依存、import不足、評価順依存が残っている。Phase 5ではこれらを解消し、連結方式を廃止して、全テストファイルがESM importのみで動作する状態を実現する。

### 現在の連結方式

`/Users/studio/Documents/GitHub/FehBattleSimulator/vitest.setup.js` では、45個のソースファイルを順番に読み込み、`filterImportExport`関数でimport/export文をストリップし、`vm.runInThisContext`で1つのグローバルスコープに連結実行している。これにより、ESMとしては不正な依存関係（未import・循環参照）がテスト環境で動作してしまっている。

```javascript
function filterImportExport(content) {
    return content
        .split('\n')
        .filter(line => !(/^import /.test(line) || /^export \{/.test(line)))
        .map(line => line.replace(/^export (function|class|const|let|var) /, '$1 '))
        .join('\n');
}
```

### 既知の循環依存（`npx madge --circular`は現時点で0件）

静的import上の循環は2箇所:

1. **SkillEffect.js <-> SkillEffectUnit.js**: SkillEffect.jsがSkillEffectUnit.jsから`ALLIES, GRANTS_BONUS`等をimport、SkillEffectUnit.jsが`EnvUnitNode`（SkillEffect.jsで定義）を暗黙に使用（import文なし、連結グローバル依存）。モジュール評価時に`const ALLIES = UNIT.sameGroup()`が実行され、`UnitsNode`クラスにTDZでアクセスする致命的問題。

2. **SkillEffect.js <-> SkillEffectField.js**: SkillEffectField.jsがSkillEffect.jsから`SingleEffectNode`をimport、SkillEffect.jsがSkillEffectField.jsから`GetSkillEffectFieldNode, ModSkillEffectFieldNode, SkillEffectField`をimport。

## 調査事項

### 調査1: 連結実行でマスクされている暗黙依存の特定

SkillEffect DSLモジュール群の各ファイルについて、以下を調査する:

- **import不足シンボル**: ファイル内で使用されているが`import`文がないシンボル
- **定義元ファイルのマッピング**: 各不足シンボルがどのファイルで定義・exportされているか
- **評価順依存（TDZ / 初期化順）**: モジュール評価時に他モジュールの未初期化バインディングにアクセスするパターン

主要な調査対象ファイル:

| ファイル | 行数 | import状況 | 不足import推定数 |
|---------|------|-----------|-----------------|
| `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SkillEffectAliases.js` | 1,774 | import文ゼロ | 1,000+ |
| `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SkillImpl202501.js` | ~15,000 | 最小限 | ~891 |
| `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SkillImpl202408.js` | ~4,000 | 部分的 | ~548 |
| `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SkillImpl.js` | ~3,500 | 部分的 | ~500 |
| `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SkillImpl202601.js` | ~1,950 | 部分的（5つのimport文あり） | ~200 |
| `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SkillEffectBattleContext.js` | 3,845 | 部分的 | 要調査 |
| `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SkillEffectHooks.js` | 594 | 部分的 | 要調査 |
| `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SkillEffectRegistrar.js` | 244 | 部分的 | 要調査 |
| `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/CustomSkill.js` | ~700 | 要調査 | 要調査 |
| `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/UnitSkillEffect.js` | ~2,000 | 部分的 | 要調査 |

**調査手法**: 各ファイルを単独でESMとして動的importし、`ReferenceError`や`TypeError`が出るシンボルを特定する。madge等の静的ツールも併用。

### 調査2: filterImportExportのre-export構文対応

現在の`filterImportExport`は以下のパターンのみ処理する:
- `import ...` で始まる行を除去
- `export { ... }` で始まる行を除去
- `export function/class/const/let/var` のexportキーワードを除去

**処理できないパターン**:
- `export * from './x.js'`
- `export { x } from './y.js'`（re-export構文）

Section 2-3でSkillEffectUnit.jsとSkillEffectField.jsをre-exportファイルに変換する際、Section 12（連結廃止）までの過渡期に`vitest.setup.js`がSyntaxErrorを起こす可能性がある。

**対策の選択肢**:
1. `filterImportExport`の正規表現を拡張して`export * from`と`export { ... } from`も除去する
2. re-exportファイルを連結対象から除外する（`SOURCE_FILE_NAMES`配列から削除）
3. re-export構文を使わず、個別のimport+exportで書く

この調査で最適な対策を決定する。

### 調査3: 未エクスポートシンボル6件の特定と対処

specで言及されている「定義元ファイルでexportされていない6件」を特定する。これらはSection 5-9のimport追加前に解決が必要（定義元がexportしていなければimportできない）。

**調査手法**: 連結実行のグローバルスコープで使われているが、定義元ファイルの`export`文に含まれていないシンボルを特定する。特にSkillEffect.js、SkillEffectBattleContext.js、SkillEffectHooks.jsの各exportブロックを精査する。

### 調査4: UnitSkillEffect.jsのinitUnitSkillEffects(Unit)パターン

`/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/UnitSkillEffect.js` は`initUnitSkillEffects(UnitClass)`関数をexportし、Unit.prototypeにスキル効果関連メソッドを追加する。

**ブラウザ側（解決済み）**: 各`*Main.js`から明示的に`initUnitSkillEffects(Unit)`が呼ばれている:
- `ArenaSimulatorMain.js`, `SummonerDuelsSimulatorMain.js`, `DamageCalculatorMain.js` 等、全8つのエントリーポイントで呼び出し済み

**テスト環境**: `vitest.setup.js`の連結コードの末尾に`initUnitSkillEffects(Unit);`が追加されている。連結方式廃止後は:
- テスト用のセットアップで明示的に呼び出す必要がある
- 重複初期化や未初期化を防ぐ設計が必要
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/Unit.js` line 17で`initUnitSkillEffects`がre-exportされている点にも注意

### 調査5: g_appDataのテスト間状態管理

`g_appData`は`/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/AppDataGlobal.js`で管理されるアプリケーション状態。

**現在のテストでの使用パターン**: テストファイルで`globalThis.g_appData = ...`で直接設定している:
- `Tests/DslNode.test.js`: `globalThis.g_appData = calculator.unitManager;`
- `Tests/DamageCalculator.test.js`: `globalThis.g_appData = calclator.unitManager;`
- `Tests/BeginningOfTurnSkillHandler.test.js`: `globalThis.g_appData = handler.unitManager;`
- `Tests/Performance.test.js`: `globalThis.g_appData = calculator.unitManager;`

**問題点**:
- `vm.runInThisContext`時代は毎テストで同じグローバルスコープに書き込んでいた
- ESM importではモジュールがキャッシュされる（`AppDataGlobal.js`のexport変数は1つのインスタンス）
- `globalThis.g_appData`への代入とESMモジュール内の`g_appData`変数が別物になる可能性
- Vitestの`singleThread: true`設定により、テスト間でモジュールキャッシュが共有される

**調査ポイント**:
- `setAppData`関数の存在と使用方法（`AppDataGlobal.test.js`で確認済み）
- ESM化後に`globalThis.g_appData = ...`パターンが動作するか
- 必要に応じて`setAppData()`への書き換え方針を策定

### 調査6: テストコード内のESM Read-Only bindings調査

ESMのimportはread-only。`import { g_appData } from '...'`した変数を`g_appData = mock`で上書きするとTypeError。

**調査対象**: 全テストファイルで`globalThis.xxx =`や変数再代入パターンを確認。

現時点で判明しているパターン:
- `globalThis.g_appData = ...`（多数のテストファイル）: `g_appData`がESM importされた場合に問題になる
- `window.showSettingDialog = vi.fn()`等（`Tests/PiniaStore.test.js`）: window関数のモック

**対処方針**: `vi.mock()`への書き換え、またはファクトリ関数パターン（`setAppData()`等）の使用。

## テスト

このセクションでは2つのベースラインテストを作成する。

### テストファイル: `/Users/studio/Documents/GitHub/FehBattleSimulator/Tests/Phase5Baseline.test.js`

```javascript
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'child_process';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Phase 5 Baseline', () => {
    // ベースライン: madge --circularが0件であることのスナップショット
    it('madge --circular reports no circular dependencies', { timeout: 30000 }, () => {
        // Phase 4で循環依存ゼロを達成済み。Phase 5を通じてこの状態を維持する。
        let exitCode = 0;
        try {
            execFileSync('npx', ['madge', '--circular', '--no-color', 'Sources/'], {
                cwd: process.cwd(),
                encoding: 'utf-8',
                timeout: 30000,
                stdio: ['pipe', 'pipe', 'pipe'],
            });
        } catch (e) {
            exitCode = e.status || 1;
        }
        expect(exitCode).toBe(0);
    });

    // ベースライン: filterImportExportがexport * from構文を処理できないことの確認
    it('filterImportExport does not handle re-export syntax', () => {
        // vitest.setup.jsのfilterImportExportを読み込んで動作確認
        const setupContent = readFileSync(
            resolve(process.cwd(), 'vitest.setup.js'), 'utf-8'
        );

        // filterImportExport関数の正規表現を抽出して検証
        // export * from './x.js' は /^export \{/ にマッチしない
        const reExportLine = "export * from './SkillEffect.js';";
        const exportNamedReExportLine = "export { Foo } from './SkillEffect.js';";

        // 現在のフィルタロジック再現
        const isFilteredByImport = /^import /.test(reExportLine);
        const isFilteredByExport = /^export \{/.test(reExportLine);
        // export * from は除去されない
        expect(isFilteredByImport || isFilteredByExport).toBe(false);

        // export { Foo } from './x.js' は /^export \{/ にマッチする（除去される）が、
        // from句が残らないことを確認（現在のフィルタは行全体を除去するので問題なし）
        const isNamedReExportFiltered = /^export \{/.test(exportNamedReExportLine);
        expect(isNamedReExportFiltered).toBe(true);
    });
});
```

**テストの目的**:
1. Phase 4で達成した循環依存ゼロの状態がベースラインとして記録される
2. `filterImportExport`のre-export構文対応の限界を明文化し、Section 2-3の対策決定に活用する

## 成果物

1. **ベースラインテストファイル**: `Tests/Phase5Baseline.test.js` — 作成済み、2テスト合格
2. **調査結果**: 以下に記録

## 調査結果

### 調査1: 暗黙依存の特定
- 主要ファイルのexportブロックを精査した結果、**クロスモジュールで使用されている未exportシンボルは見つからなかった**
- 各ファイル内に多数の内部定数（exportされていないが同一ファイル内でのみ使用）が存在するが、これらはexport不要
- 実際の不足importシンボルはsection 06-10で各ファイルにESM importを追加する際に動的importテストで発見する方針

### 調査2: filterImportExport re-export対応
- **決定: Option A（正規表現拡張）** — `/^export (\{|\*)/` に変更して `export * from` も除去対象に含める
- 現在のコードベースに `export * from` 構文は存在しないが、Section 02-03でre-exportファイル変換時に必要になる
- Option B（SOURCE_FILE_NAMESから除外）は依存チェーンが壊れるため不可
- Option C（個別import+export）は保守性が低いため不採用

### 調査3: 未exportシンボル
- SkillEffect.js, SkillEffectBattleContext.js, SkillEffectHooks.js, SkillEffectRegistrar.jsのexportブロックを精査
- **クロスモジュールで参照されている未exportシンボルは0件**（想定の6件より少ない）
- 各ファイル内にある未export定数（88件@SkillEffect.js, 72件@BattleContext, 18件@Hooks）はすべて同一ファイル内でのみ使用
- section-05では動的importテストで再検証し、必要に応じてexport追加する

### 調査4: initUnitSkillEffects
- `UnitSkillEffect.js`で定義、Unit.prototypeに21メソッド+1プロパティを追加
- ブラウザ側: 8つの*Main.jsエントリーポイントで明示的に呼び出し済み
- テスト環境: `vitest.setup.js` line 61で連結コード末尾に `initUnitSkillEffects(Unit);` を追加
- **方針**: 連結廃止後は `TestGlobals.js` のESM化時にモジュール評価時の副作用として `initUnitSkillEffects(Unit)` を呼び出す。全テストファイルが `TestGlobals.js` をimportすることで初期化を保証

### 調査5: g_appData状態管理
- `AppDataGlobal.js` で `export var g_appData` と `export function setAppData(appData)` が定義済み
- テストファイルの20箇所以上で `globalThis.g_appData = ...` パターンを使用:
  - Tests/BeginningOfTurnSkillHandler.test.js (1箇所)
  - Tests/SkillEffect.test.js (3箇所)
  - Tests/DamageCalculator.test.js (3箇所)
  - Tests/DslNode.test.js (5箇所)
  - Tests/Performance.test.js (2箇所)
  - Tests/TestHelper.test.js (6箇所以上)
- **方針**: 全 `globalThis.g_appData = X` を `setAppData(X)` に置換。`setAppData()`はAppDataGlobal.jsからimport

### 調査6: ESM Read-Only bindings
- `globalThis.g_appData = ...` の20箇所以上が主要な違反パターン（調査5と同一）
- `window.xxx = vi.fn()` パターン（Tests/PiniaStore.test.js）はモック定義であり問題なし
- *Main.jsの `window.g_app = g_app` 等はHTML/ESMブリッジとして意図的であり問題なし
- **方針**: section-11でテストファイルのESM化時に `setAppData()` への書き換えを実施

## コードレビュー修正

- `setupContent` 未使用変数を削除（readFileSync/resolve importも削除）
- madgeテストに失敗時の診断出力を追加（stderr/stdout捕捉）

## 依存関係

- **前提条件**: なし（Phase 5の最初のセクション）
- **後続セクションへの影響**: 全セクション（02〜14）がこの調査結果に依存
  - Section 02-03: filterImportExport対策 → Option A（正規表現拡張）
  - Section 05（未exportシンボル）: 動的importテストで再検証
  - Section 06-10: 不足importシンボルは各セクションで動的importテストで特定
  - Section 11: `globalThis.g_appData = X` → `setAppData(X)` 置換
  - Section 12: `TestGlobals.js`で `initUnitSkillEffects(Unit)` 呼び出し