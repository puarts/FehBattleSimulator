# Phase 4: ESM循環参照解消計画

## 概要

Phase 2のESM移行で各ソースファイルに`import`/`export`文が追加されたが、ファイル間のクロスリファレンスの多くが未解決のまま残っている。Phase 3のVitest移行時に問題が顕在化し、`vm.runInThisContext`による連結方式ワークアラウンドで対応した。

本フェーズでは循環参照を解消し、全ソースファイルが正規のESMモジュールとして動作する状態にする。

## 現状の問題

### 数値的な規模

- テスト依存チェーン内: **36ファイル、2,164個の不足import**（212 import行）
- プロジェクト全体: **44+ファイル、3,112個の不足import**（357 import行）
- 単純にimportを追加すると**循環参照**が発生し、モジュール初期化が失敗する

### 循環参照の具体例

```
Logger.js → Utilities.js → Unit.js → Skill.js → SkillEffect.js → SkillEffectCore.js → Logger.js
```

`Logger.js`の`static`フィールド初期化子が`ObjectUtil.makeMapFromObj()`を呼ぶが、循環importにより`ObjectUtil`がまだ`undefined`の時点で実行され`TypeError`が発生。

### 根本原因

コードベースは`<script>`タグ連結方式（グローバルスコープ共有）で設計されている。`create_tests.sh`のファイル順序:

```
GlobalDefinitions → Utilities → Logger → SkillConstants → Skill →
BattleMapElement → Tile → Structures → Cell → Table →
HeroInfoConstants → HeroInfo → UnitConstants → BattleContext → Unit →
UnitManager → BattleMap → GlobalBattleContext → DamageCalculationUtility →
DamageCalculator → PostCombatSkillHander → DamageCalculatorWrapper →
BeginningOfTurnSkillHandler → SkillDatabase → HeroDatabase →
SampleSkillInfos → SampleHeroInfos → SkillEffectCore → SkillEffectEnv →
SkillEffect → SkillEffectField → SkillEffectUnit →
SkillEffectBattleContext → SkillEffectHooks → SkillEffectRegistrar →
SkillEffectAliases → CustomSkill → SkillImpl → SkillImpl202408 →
SkillImpl202501 → SkillImpl202601 → TestUtilities
```

この順序で連結すれば後のファイルは前のファイルの変数を参照できる。しかしESMでは各ファイルが独立スコープを持ち、循環importは部分的にしか解決されない。

### 双方向参照の主な箇所

| ファイルA | → | ファイルB | 参照内容 |
|-----------|---|-----------|----------|
| Skill.js | ↔ | SkillEffect.js | StatusEffectType ↔ DSLノード群 |
| Skill.js | ↔ | Unit.js | SkillInfo ↔ Unit |
| Unit.js | ↔ | SkillEffect.js | Unit ↔ エフェクトノード |
| Unit.js | ↔ | SkillEffectHooks.js | Unit ↔ フック群（22箇所） |
| SkillEffect.js | ↔ | SkillEffectBattleContext.js | DSLノード ↔ 戦闘DSLノード |
| Utilities.js | → | Unit.js/Tile.js/SkillConstants.js | ユーティリティクラスが上位モデルを参照 |
| Logger.js | → | Utilities.js | static初期化子でObjectUtil使用 |

### 大規模ファイル

| ファイル | 行数 | 不足import数 | 備考 |
|----------|------|-------------|------|
| SkillImpl202501.js | ~15,000 | 891 | 最新スキル実装、最多import |
| SkillImpl202408.js | ~12,000 | 548 | |
| SkillEffect.js | ~9,700 | 43 | DSLノード定義 |
| Unit.js | ~6,000 | 73 | エンティティクラス |
| DamageCalculatorWrapper.js | ~4,500 | 35 | 戦闘ロジック |
| Skill.js | ~2,100 | 30 | スキルデータモデル |

## 解消戦略

### レイヤーアーキテクチャ

循環参照を解消するため、ファイルをレイヤーに分類し、**上位→下位のみ参照可**の制約を導入する。

```
Layer 0 (Base):      GlobalDefinitions, Utilities (core部分), Logger (core部分)
Layer 1 (Constants): SkillConstants, HeroInfoConstants, UnitConstants
Layer 2 (Models):    Skill (data部分), HeroInfo, Tile, Cell, BattleMapElement, Structures, Table
Layer 3 (Entities):  Unit, BattleContext, UnitManager, BattleMap, GlobalBattleContext
Layer 4 (Logic):     DamageCalculator, DamageCalculatorWrapper, BeginningOfTurnSkillHandler,
                     PostCombatSkillHander, SkillDatabase, HeroDatabase
Layer 5 (DSL):       SkillEffectCore, SkillEffectEnv, SkillEffect, SkillEffectField,
                     SkillEffectUnit, SkillEffectBattleContext, SkillEffectHooks,
                     SkillEffectRegistrar, SkillEffectAliases
Layer 6 (Impl):      SkillImpl, SkillImpl202408, SkillImpl202501, SkillImpl202601, CustomSkill
Layer 7 (Data):      SampleSkillInfos, SampleHeroInfos
Layer 8 (Test):      TestUtilities
```

### 循環解消の具体的手法

#### 1. ファイル分割（大ファイル→責務ごと）

**Skill.js → 3分割:**
- `SkillInfo.js` — SkillInfo クラス、スキルデータ構造（Layer 2）
- `StatusEffect.js` — StatusEffectType 列挙型（Layer 1に移動可）
- `SkillUI.js` — UI関連コード（Layer 3+、遅延importまたは分離）

**Unit.js → 2-3分割:**
- `Unit.js` — Unit クラスのコアプロパティ・状態管理（Layer 3）
- `UnitSkillEffect.js` — スキル効果適用ロジック（Layer 4+）
- `UnitCombat.js` — 戦闘関連メソッド（Layer 4+）

**Utilities.js → 2分割:**
- `Utilities.js` — ObjectUtil, MathUtil, ArrayUtil等の汎用ユーティリティ（Layer 0）
- `GameUtilities.js` — Unit/Tile/Skill依存のゲーム固有ユーティリティ（Layer 3+）

#### 2. 型参照と実行時参照の分離

多くの循環参照は**JSDocの型アノテーション**に起因する。これらは実行時には不要：

```js
// Before: 実行時importとして記述
import { Unit } from './Unit.js';

/**
 * @param {Unit} unit  ← 型としてのみ使用
 */
function processUnit(unit) { ... }
```

JSDoc型参照は`@typedef`やコメントに移行し、実行時importから除外できる。

#### 3. 依存方向の逆転（Dependency Inversion）

下位レイヤーが上位を参照している箇所は、コールバックやインターフェースで逆転：

```js
// Before: Logger.js (Layer 0) が Utilities.js の ObjectUtil を static初期化子で使用
class LoggerBase {
    static LOG_LEVEL_MAP = ObjectUtil.makeMapFromObj(this.LogLevel);
}

// After: インライン化またはlazy初期化
class LoggerBase {
    static _logLevelMap = null;
    static get LOG_LEVEL_MAP() {
        if (!this._logLevelMap) {
            this._logLevelMap = new Map(Object.entries(this.LogLevel).map(([k, v]) => [v, k]));
        }
        return this._logLevelMap;
    }
}
```

#### 4. `g_appData`グローバルの正式な解決

`g_appData`は20ファイル・503箇所で参照されるグローバル変数。現在は`globalThis.g_appData`で対応。

正式な解決案:
- **Singleton パターン**: `AppState.getInstance()` で集中管理
- **DI (Dependency Injection)**: 必要な箇所にコンストラクタ引数で渡す
- **Context パターン**: 戦闘コンテキストに`appData`を含める

推奨: 段階的にDIパターンへ移行。テストでは`test_DamageCalculator`等のテストクラスが既にUnitManagerを内包しているため、`g_appData`参照を`this.unitManager`に置換。

## 実装計画

### Section構成案（/deep-planで詳細化）

| Section | 内容 | 規模 |
|---------|------|------|
| 1 | 依存グラフの可視化・分析ツール作成 | 小 |
| 2 | Layer 0-1: Base/Constants層の循環解消 | 中 |
| 3 | Layer 2: Models層のファイル分割（Skill.js等） | 大 |
| 4 | Layer 3: Entities層の循環解消（Unit.js分割） | 大 |
| 5 | Layer 4-5: Logic/DSL層の循環解消 | 大 |
| 6 | Layer 6: SkillImpl群のimport追加 | 大（機械的） |
| 7 | g_appDataのDI化 | 中 |
| 8 | vitest.setup.jsの連結方式→ESM import方式への切替 | 小 |
| 9 | Jest/create_tests.sh完全除去 | 小 |

### 前提条件

- Phase 3（Vite/Vue 3移行）が完了していること
- 全テストがVitestで動作していること（連結方式でOK）
- CIがVitestベースに切り替わっていること（Phase 3 Section 12）

### 検証方法

各Sectionで:
1. 対象ファイルのimportを修正
2. `vitest.setup.js`の`SOURCE_FILE_NAMES`リストから対象ファイルを除去
3. `npx vitest run` で全テスト通過を確認
4. 連結リストから除去されたファイルが正規ESMとして動作することを確認

### リスクと注意点

- **SkillImpl群は行数が非常に多い**（合計4万行超）。import追加は機械的だがレビューが困難
- **g_appData除去は広範囲に影響**。段階的に進め、各ステップでテスト通過を確認
- **Viteビルドとの互換性**: Viteバンドラは循環参照を解決できるが、テスト（Vitest）では解決できない。ビルドが通ってもテストが壊れるケースに注意
- **既存のcreate_tests.sh依存**: CIが`create_tests.sh`+Jestを使っている間は、連結方式との互換性を維持する必要がある

## 参考: Phase 3 Section 04で試行した内容

1. `Tests/testImports.js`バレルファイルを作成 → SkillImpl side-effect importから循環参照エラー
2. 自動スクリプトで2,164個のimportを追加 → Utilities.js→Unit.js等の循環でLogger.js初期化失敗
3. `vm.runInThisContext`連結方式を採用 → 全333テスト通過

自動スクリプト（`scripts/trace-test-deps.mjs`等）は削除済みだが、同様のアプローチで依存分析が可能。
