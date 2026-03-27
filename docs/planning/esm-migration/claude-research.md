# ESM/Vite移行リサーチ結果

## Part 1: コードベース分析

### 1. グローバル変数の定義と使用

#### g_ プレフィクス付きグローバル変数

**GlobalDefinitions.js:**
- パス定数: `g_siteRootPath`, `g_explicitSiteRootPath`, `g_imageRootPath`, `g_corsImageRootPath`, `g_audioRootPath`, `g_heroIconRootPath`, `g_skillIconRootPath`, `g_iconRootPath`
- デバッグ用: `g_debugImageRootPath`, `g_debugSkillIconRootPath`
- マップパス: `g_summonerDuelsMapRelativeRoot`, `g_arenaMapRelativeRoot`, `g_summonerDuelsMapRoot`, `g_arenaMapRoot`

**AppData.js:**
- `g_idGenerator` — IdGeneratorインスタンス
- `g_deffenceStructureContainer` — StructureContainerインスタンス
- `g_offenceStructureContainer` — StructureContainerインスタンス
- `g_appData` — **最重要**: AppDataシングルトン（line 2506で生成）

**Main_MouseAndTouch.js:**
- `g_keyboardManager` — KeyboardManagerインスタンス

**SkillConstants.js:**
- `g_engagedSpecialIconRoot`, `g_debugEngagedSpecialIconRoot`

#### g_appData の重要性

アプリケーション状態の中核シングルトン。以下から直接参照される:
- `BattleSimulatorBase.js`: `this.appData = g_appData`
- `DamageCalculatorWrapper.js`: コンストラクタパラメータ
- `BeginningOfTurnSkillHandler.js`: コンストラクタパラメータ
- その他多数

#### Object.freeze定数群
16個のフリーズオブジェクト: MoveResult, ModuleLoadState, GameMode, ItemType, SelectMode等

### 2. クラス依存グラフ

#### 総クラス数: 857

#### コアアーキテクチャ

```
BattleSimulatorBase（メインアプリコントローラ、Vue生成）
├── AetherRaidSimulator extends BattleSimulatorBase
├── ArenaSimulator extends BattleSimulatorBase
├── SummonerDuelsSimulator extends BattleSimulatorBase
├── UnitBuilderMain extends BattleSimulatorBase
└── DamageCalculatorMain

AppData extends UnitManager（グローバル状態コンテナ）
├── GlobalBattleContext
├── SettingManager, AudioManager
├── BattleMap
├── Unit, HeroDatabase, SkillDatabase
└── Structures

DamageCalculatorWrapper
├── DamageCalculator
├── PostCombatSkillHander
└── UnitManager, BattleMap, GlobalBattleContext

SkillEffectシステム
├── SkillEffectCore（DSLノード基盤）
├── SkillEffect（140+ノードクラス）
├── SkillEffectField, SkillEffectUnit, SkillEffectBattleContext, SkillEffectHooks
├── SkillEffectRegistrar
├── SkillEffectAliases
└── SkillImpl → SkillImpl202408 → SkillImpl202501 → SkillImpl202601
```

### 3. ファイルロードメカニズム

#### HTMLエントリポイント: 8個

| ファイル | 説明 | メインクラス |
|---------|------|------------|
| AetherRaidSimulator.html | 飛空城 | AetherRaidSimulator |
| ArenaSimulator.html | 闘技場 | ArenaSimulator |
| SummonerDuelsSimulator.html | 英雄決闘 | SummonerDuelsSimulator |
| DamageCalculator.html | ダメージ計算 | DamageCalculatorMain |
| UnitBuilder.html | ユニットビルダー | UnitBuilderMain |
| StatusCalculator.html | ステータス計算 | StatusCalcMain |
| HeroIconLister.html | 英雄アイコン | HeroIconListerMain |
| HeroStatusClusterer.html | ステータスクラスタリング | HeroStatusClustererData |

#### スクリプトロード方式

1. 外部ライブラリ（CDN）: jQuery 3.7.0, jQuery UI 1.12.1, **Vue 2.5.13**, Vuex 3.6.2, Select2, SortableJS, Vue.Draggable, LZ-String, Tesseract.js
2. `Local.js`で`SKILL_EFFECT_FILES`と`SKILL_IMPL_FILES`を定義
3. `window.addEventListener('load')` → `loadScripts()`で逐次ロード
4. 各スクリプトは`onload`コールバックで次をロード（完全に逐次、並列化なし）

#### ロード順序（create_tests.shと一致）

```
GlobalDefinitions → Utilities → Logger → SkillConstants → Skill →
BattleMapElement → Tile → Structures → Cell → Table →
HeroInfoConstants → HeroInfo → UnitConstants → BattleContext → Unit →
UnitManager → BattleMap → GlobalBattleContext →
DamageCalculationUtility → DamageCalculator → PostCombatSkillHander →
DamageCalculatorWrapper → BeginningOfTurnSkillHandler →
SkillDatabase → HeroDatabase → SampleSkillInfos → SampleHeroInfos →
[SkillEffect系] → [SkillImpl系] → [UI/Main系]
```

### 4. 循環依存の検出

1. **AppData ↔ BattleSimulatorBase**: g_appDataシングルトンによる緩和
2. **Unit ↔ BattleContext ↔ BattleMap**: 参照渡しで緩和（直接インスタンス化なし）
3. **SkillEffectシステム**: 直接的な循環なし、ロード順序に依存
4. **DamageCalculator ↔ PostCombatSkillHandler**: Wrapperが両方を生成

**最大リスク**: AppData.jsとBattleSimulatorBase.jsのロード順序が崩れるとシングルトンパターンが破綻

### 5. Vue.js統合

- **Vue 2.5.13**（CDN読み込み、Vue 3ではない）
- **Vuex 3.6.2**（Vue 2用）
- 20+コンポーネントが`Vue.component()`でグローバル登録（VueComponents.js）
- Vueインスタンスは`BattleSimulatorBase.js`の`#create_vue()`メソッドで生成
- Vuexは`Vuex.mapState()`でコンポーネントから利用
- **SFCなし**: すべてJSオブジェクトとして定義
- テンプレートはHTML内のインラインテンプレート

### 6. jQuery使用状況

- **軽〜中程度の使用**: 11ファイルで使用
- 主な用途: DOM選択(`$('.selector')`)、jQuery UIダイアログ、Select2
- `$.ajax()`は未使用（API呼び出しなし）
- **置換可能**: 大部分はvanilla JSまたはVueディレクティブで代替可能
- **注意**: jQuery UIダイアログは代替ライブラリが必要

### 7. 巨大ファイル分析

| ファイル | サイズ | 責務 | 分割候補 |
|---------|-------|------|---------|
| SkillImpl202501.js | 21,875行 | 2025年1月以降のスキル実装（700+ハンドラ） | スキル種別ごと（武器/補助/奥義/パッシブ） |
| DamageCalculatorWrapper.js | 17,193行 | ダメージ計算ラッパー + パフォーマンスプロファイリング | PerformanceProfile抽出、ユーティリティ分離 |
| BattleSimulatorBase.js | 12,307行 | **God Object** — Vue生成、バトルロジック、移動、コマンドキュー、設定保存、AI連携 | 5-6モジュールに分割推奨 |
| SkillEffect.js | 9,632行 | DSLノードシステム（140+クラス） | 基盤/クエリノード/エフェクトノード |
| Unit.js | 7,424行 | ユニット表現（200+メソッド） | ステータス管理/アクション/状態管理 |

### 8. テストセットアップ

- **jest.config.js**: `testEnvironment: "jsdom"`, `testMatch: ["**/All.test.js"]`
- **create_tests.sh**: 全ソースを結合 → All.test.js生成
- **テストカテゴリ**: skill, combat, dsl, infra
- **テストファイル**: 16スイート
- **テストユーティリティ**: UnitBuilder, BattleScenarioBuilder, RegressionTestHelper
- **課題**: モノリシック結合方式はESMと互換性なし

### 9. Mixinパターン

SkillEffect.jsで`Object.assign(prototype, Mixin)`パターンを多用:
- GetUnitMixin, GetTargetsFoeMixin, GetUnitDuringCombatMixin等（8種類）
- 100+ノードサブクラスに適用
- 継承チェーンを避けた合成パターン

---

## Part 2: Webリサーチ結果

### 1. グローバルJSからのVite移行パターン

#### 推奨パターン: レガシーJS結合プラグインによる段階移行

**[vite-plugin-legacy-js-concat](https://github.com/adessoSE/vite-plugin-legacy-js-concat)** がこのユースケースに最適:

```javascript
import { legacyConcat } from '@adesso-se/vite-plugin-legacy-js-concat';

export default defineConfig({
  plugins: [
    legacyConcat({
      files: ['scripts/config.js', 'scripts/helpers.js', 'scripts/logic.js']
    })
  ]
});
```

- 既存のファイル結合順序を維持
- グローバルスコープの依存関係をそのまま動作
- `virtual:legacy-bundle`として仮想モジュールを生成
- ESM化完了ファイルから順次リストから除外可能

類似: [@vituum/vite-plugin-concat](https://vituum.dev/plugins/concat)

#### 互換レイヤーパターン

```javascript
// ESM化済みファイル
export class HeroDatabase { ... }
// レガシーコードとの互換性
Object.assign(globalThis, { HeroDatabase });
```

#### 重要な注意点

- ViteはHTMLを起点として`<script type="module">`を解決
- `window.global`の自動定義なし（jQuery等のライブラリに影響の可能性）
- 開発時はネイティブESM、ビルド時はRolldown（Vite 8以降）

**Sources:** [Vite Getting Started](https://vite.dev/guide/), [vite-plugin-legacy-js-concat](https://github.com/adessoSE/vite-plugin-legacy-js-concat)

### 2. 大規模コードベースのESM段階的移行戦略

#### フェーズドアプローチ

1. **基盤準備**: `"type": "module"` 追加、Vite導入 + レガシー結合プラグイン
2. **ボトムアップESM化**: リーフファイルから`export`/`import`追加、結合リストから除外
3. **コアモジュールESM化**: 依存グラフの上流に向かって順次変換
4. **クリーンアップ**: `globalThis`ブリッジ除去、レガシープラグイン削除

#### 実績

- **60k LOC TypeScript移行事例**（Logto社）: テスト時間3-4倍高速化
- CJS→ESM自動変換ツール **cjstoesm** は約80%を自動処理（ただし本プロジェクトはCJSですらないため直接使用不可）

**Sources:** [ES modules migration](https://yaraslav.com/2023/10/17/esmodules.html), [Logto 60k LOC migration](https://dev.to/logto/migrate-a-60k-loc-typescript-nodejs-repo-to-esm-and-testing-become-4x-faster-12-5f82)

### 3. JestからVitestへの移行

#### 移行手順

1. `npm uninstall jest && npm install -D vitest`
2. コードモッド実行: `npx codemod jest/vitest`（`jest.fn()` → `vi.fn()`等を自動変換）
3. vitest.config.js作成: `environment: 'jsdom'`, `globals: true`

#### 重要なAPI差異

| Jest | Vitest | 注意 |
|------|--------|------|
| `jest.fn()` | `vi.fn()` | 自動変換可 |
| `jest.setTimeout()` | `vi.setConfig({ testTimeout })` | API構造が異なる |
| `jest.requireActual()` | `await vi.importActual()` | **非同期化** |
| `mockReset()` | `mockReset()` | 挙動差あり: Jestは空関数、Vitestは元実装に戻す |

#### 本プロジェクトへの考慮

- `create_tests.sh`のファイル結合はVitestでは不要（ネイティブモジュール解決）
- `globals: true`で既存テストの`describe`/`test`/`expect`互換性を確保
- パフォーマンス: 一般的に3-10倍の速度向上

**Sources:** [Vitest Migration Guide](https://vitest.dev/guide/migration.html), [Vitest vs Jest 2026](https://www.sitepoint.com/vitest-vs-jest-2026-migration-benchmark/)

### 4. Viteマルチページアプリケーション構成

#### 基本設定

```javascript
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'Sources',
  build: {
    rolldownOptions: {
      input: {
        arena: resolve(__dirname, 'Sources/ArenaSimulator.html'),
        duels: resolve(__dirname, 'Sources/SummonerDuelsSimulator.html'),
        builder: resolve(__dirname, 'Sources/UnitBuilder.html'),
        status: resolve(__dirname, 'Sources/StatusCalculator.html'),
        // ... 他のエントリポイント
      },
    },
  },
});
```

#### 特徴

- 開発サーバーでは各HTMLに直接アクセス可能（`/ArenaSimulator.html`）
- ビルド時に共有コードの自動コード分割
- `root: 'Sources'`でクリーンなURL構成

**Sources:** [Vite Building for Production](https://vite.dev/guide/build), [Vite MPA Guide](https://runebook.dev/en/articles/vite/guide/build/multi-page-app)

---

## 移行における重要な発見と推奨事項

### 発見1: Vue 2.5.13は既にEOL

Vue 2は2023年末にEOLを迎えている。Vite移行と同時にVue 3への移行を検討する必要がある。ただし、スコープが大きくなりすぎるため、段階的に行うべき。

### 発見2: レガシー結合プラグインが鍵

`vite-plugin-legacy-js-concat`により、既存の64ファイルの結合順序を維持しながらViteを導入できる。これにより「ビッグバン」を避けた段階的移行が可能。

### 発見3: テスト移行はESM化と並行可能

Vitestはグローバルスコープのコードもテスト可能（`globals: true`）。ESM化が完了していない段階でもVitest移行は開始できる。

### 発見4: BattleSimulatorBaseがGod Object

12,307行に6つ以上の責務が混在。ESM化の前にモジュール分割が強く推奨される。

### 発見5: 循環依存はシングルトンパターンで緩和済み

`g_appData`を中心とした循環参照があるが、ロード順序とシングルトンパターンで機能している。ESM化時にはモジュールの評価順序に注意が必要。
