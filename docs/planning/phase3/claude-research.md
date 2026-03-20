# Phase 3 リサーチ結果

## 1. コードベース調査

### 1.1 プロジェクト構造

**シミュレーター HTML（8つ）** — すべて `Sources/` に配置:
1. AetherRaidSimulator.html — 飛空城シミュレーター
2. ArenaSimulator.html — 闘技場シミュレーター
3. SummonerDuelsSimulator.html — 召喚師決闘
4. DamageCalculator.html — ダメージ計算機
5. UnitBuilder.html — ユニットビルダー
6. StatusCalculator.html — ステータス計算機
7. HeroIconLister.html — 英雄アイコン一覧
8. HeroStatusClusterer.html — 英雄ステータスクラスタリング

**JS ソースファイル: 64ファイル** in `Sources/`:
- スキル効果システム（8ファイル）: `SkillEffectCore.js`, `SkillEffectEnv.js`, `SkillEffect.js` 等
- スキル実装（6ファイル）: `SkillImpl.js`, `SkillImpl202408.js` 〜 `SkillImpl202601.js`
- コアインフラ（約25ファイル）: `GlobalDefinitions.js`, `Unit.js`, `BattleMap.js` 等
- データ/設定（5ファイル）: `SkillDatabase.js`, `HeroDatabase.js` 等
- UI/メイン（5ファイル）: `VueComponents.js`, `BattleSimulatorBase.js`（約12K行）
- エントリポイント（8ファイル）: 各シミュレーターの `*Main.js`

### 1.2 ビルドシステム

**`scripts/build.mjs`**:
- 全ソースファイルを読み込み、import/export 文を除去して結合
- シミュレーターごとに異なるファイルリスト（BASE_FILES + SKILL_EFFECT_FILES + SKILL_IMPL_FILES + 個別メイン）
- `dist/` に7つのバンドルを出力（minified/unminified）
- `--deploy` オプションで本番サイトにコピー

**`create_tests.sh`**:
- 44ソースファイル + 2テストユーティリティ + 18テストファイルを結合
- import/export フィルタ適用
- 単一の `All.test.js` を生成 → Jest で実行

**HTML の `createScriptElement`**:
- 外部URL: 直接 `<script>` ロード
- ローカルファイル: fetch → import/export 除去 → Blob URL で実行
- `loadScripts`: 再帰的逐次ローダー（前のスクリプト完了後に次をロード）

### 1.3 Vue 2 使用パターン

**Vue インスタンス生成** — `BattleSimulatorBase.js` の `#create_vue()`:
```javascript
const store = new Vuex.Store({
    state: { appData, battleSimulator: this, imageRootPath },
    mutations: {},
    actions: { updateMap, saveSettings, showSettingDialog, ... }
});
return new Vue({ el: "#app", store, data: appData, methods: this.methods });
```

**Vue コンポーネント** — `VueComponents.js`:
- `select2`: Select2 ラッパー（props: options, value, fallbackValue, isDebugMode）
- `unit-detail`: ユニット設定フォーム（`...Vuex.mapState(['battleSimulator', 'appData', 'imageRootPath'])`）
- `battle-map`: マップ描画
- `flash-message`: 通知表示

**使用機能**: v-model, v-if/v-for/v-show, @change/@input/@click, :bind, computed (mapState), methods, mounted()

**Vue インスタンス数**: 8つ（各シミュレーターに1つ）、すべて `BattleSimulatorBase` を継承

### 1.4 jQuery / 外部ライブラリ使用

**jQuery 直接使用: ほぼなし** — ソースコード内に `$(` パターンは見つからず。Select2 と jQuery UI が内部で使用。

**CDN ライブラリ一覧**:
| ライブラリ | バージョン | 用途 |
|-----------|----------|------|
| jQuery | 3.7.0 | Select2/jQuery UI の依存 |
| Select2 | 4.0.6 | 英雄/スキル選択ドロップダウン |
| jQuery UI | 1.12.1 | ドラッグ&ドロップ |
| Vue | 2.5.13 | UI フレームワーク |
| Vuex | 3.6.2 | 状態管理 |
| Sortable.js | 1.8.4 | リスト並び替え |
| Vue.Draggable | 2.23.2 | Vue ドラッグ&ドロップ |
| LZ-String | 1.4.4 | セーブデータ圧縮 |
| CropperJS | 1.5.6 | OCR 用画像クロッピング |
| Font Awesome | 6.4.2 | アイコンフォント |

### 1.5 テスト設定

- **フレームワーク**: Jest 29.7.0 (jsdom)
- **テストファイル**: 18ファイル in `Tests/`
- **設定**: `jest.config.js` — testEnvironment: jsdom, testMatch: `**/All.test.js`
- **セットアップ**: `jest.setup.js` — perf_hooks.performance, TextEncoder, TextDecoder ポリフィル
- **パターン**: describe/beforeEach/test/expect, heroDatabase を使ったユニットテスト

### 1.6 ESM 状態 (Phase 2)

- **61/64 ファイル**に import/export 文あり
- フィルタパターン: `/^import /` と `/^export \{/` で行単位除去
- 循環依存は解決済み（`validate-esm.mjs` で TDZ 検証パス）
- `check-esm-coverage.mjs` でカバレッジ検証

### 1.7 初期化フロー

```
1. HTML ロード → CDN ライブラリ読み込み
2. Local.js → ファイルリスト定義
3. window.addEventListener('load') →
   - ローカル/本番判定
   - loadScripts() で全 JS ファイル逐次読み込み
   - g_app 生成（シミュレーターインスタンス）
   - スキル/英雄オプション登録
   - 遅延画像読み込み
   - ダイアログ初期化
   - URL パラメータインポート
```

### 1.8 移行上の注意点

**ポジティブ要因**:
- 61/64ファイルに import/export 文あり（Phase 2 完了）
- jQuery の直接使用なし（ラッパー経由のみ）
- Vue 使用が集約されている（`#create_vue()` メソッド1箇所）
- テストインフラが成熟（18テストファイル）

**課題**:
- `BattleSimulatorBase.js` が 12K+ 行
- グローバルシングルトン（g_app, g_appData）
- 8つの個別 Vue インスタンス
- Vue.Draggable → Vue 3 互換版への置き換え必要
- 複雑な初期化フロー（DOM 依存が多い）

---

## 2. Web 調査結果

### 2.1 Vite マルチページアプリ構成

**設定方法**: `build.rollupOptions.input` に各 HTML を指定:
```javascript
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        aetherRaid: resolve(__dirname, 'Sources/AetherRaidSimulator.html'),
        arena: resolve(__dirname, 'Sources/ArenaSimulator.html'),
        // ... 各シミュレーター
      },
    },
  },
})
```

**コード分割**: Vite/Rollup が自動的に共有モジュールを共通チャンクに抽出。`manualChunks` でさらに制御可能。

**出力**: 各 HTML エントリポイントごとに個別の JS バンドルが生成される。`Sources/ArenaSimulator.html` → `dist/Sources/ArenaSimulator.html`。

**ライブラリモード vs マルチページモード**: FEH Simulator はマルチページモードが適切（ライブラリモードは npm パッケージ配布用）。

**出典**:
- https://vite.dev/guide/build — 公式ドキュメント
- https://vite-workshop.netlify.app/mpa — 実践ワークショップ

### 2.2 Vue 2 → Vue 3 移行

**2つの戦略**:
1. **@vue/compat（互換ビルド）**: Vue 2 互換モードで動作、段階的に Vue 3 へ切り替え
2. **直接移行（推奨）**: エントリポイントを書き換え、破壊的変更を直接修正

**FEH Simulator への推奨**: CDN Vue 2 を比較的シンプルに使用しているため、直接移行が実用的。

**主要な破壊的変更**:

| Vue 2 | Vue 3 |
|-------|-------|
| `new Vue({ el: '#app' })` | `createApp(App).mount('#app')` |
| `Vue.component()` | `app.component()` |
| `Vue.use(plugin)` | `app.use(plugin)` |
| `beforeDestroy` | `beforeUnmount` |
| `destroyed` | `unmounted` |
| filters `{{ val \| filter }}` | 削除 → computed/method |
| `$on`, `$off`, `$once` | 削除 → mitt 等 |
| `$children` | 削除 → `$refs` / provide/inject |

**Options API**: Vue 3 で完全にサポート。Composition API への移行は不要。

**出典**:
- https://v3-migration.vuejs.org/ — 公式移行ガイド
- https://v3-migration.vuejs.org/breaking-changes/ — 破壊的変更一覧

### 2.3 Vuex → Pinia 移行

**主な違い**:
| Vuex | Pinia |
|------|-------|
| mutations 必須 | **不要** — actions/コンポーネントから直接変更 |
| namespaced: true | 組み込み（store id で自動） |
| ネストモジュール | フラットストア（import で参照） |
| Options API のみ | Options + Composition API |
| ~5kb | ~1kb |

**移行手順**:
1. Pinia を Vuex と並行インストール（共存可能）
2. 各 Vuex モジュールを Pinia ストアに変換
3. コンポーネントの使用箇所を更新（mapState/mapActions はそのまま使える）

**FEH Simulator の場合**: Vuex ストアが非常にシンプル（state に appData/battleSimulator、mutations なし、actions 数個）なので移行は容易。

**出典**:
- https://pinia.vuejs.org/cookbook/migration-vuex.html — 公式移行クックブック

### 2.4 Jest → Vitest 移行

**API 互換性**: Vitest は Jest API 互換を設計目標としている。主な変更:
| Jest | Vitest |
|------|--------|
| `jest.fn()` | `vi.fn()` |
| `jest.mock()` | `vi.mock()` |
| `jest.spyOn()` | `vi.spyOn()` |

**設定**:
```javascript
// vitest.config.js
export default defineConfig({
  test: {
    globals: true,        // Jest 互換グローバル
    environment: 'jsdom', // DOM テスト
    setupFiles: ['./vitest.setup.js'],
    include: ['**/*.test.js'],
  },
})
```

**ESM ネイティブサポート**: Vitest の最大の利点。`create_tests.sh` の結合ハックが完全に不要になる。各テストファイルが proper import で依存を解決可能。

**注意点**:
- globals はデフォルト無効（`globals: true` で有効化）
- `mockReset` の挙動差異（Vitest はオリジナル実装を復元）
- モジュールモックファクトリの構造差異

**移行ツール**: `npx codemod jest/vitest`（自動変換、~90% カバー）

**出典**:
- https://vitest.dev/guide/migration.html — 公式移行ガイド

---

## 3. 横断的な推奨事項

1. **Vite マルチページモード**が適切。8つの HTML をエントリポイントとして設定。
2. **Vue 3 直接移行**（@vue/compat なし）が現実的。Options API はそのまま使える。
3. **Vuex → Pinia** は段階的移行可能（共存可）。現在のストアがシンプルなので容易。
4. **Jest → Vitest** が最も価値の高い移行。`create_tests.sh` の結合ハックを完全に排除でき、ESM ネイティブで動作。
5. **jQuery 置き換え**は Select2 の代替がキー。jQuery 自体の直接使用はほぼない。
