# Phase 3: Vite ビルド + Vitest + Vue 3 移行 — 統合仕様書

## 1. プロジェクト背景

FEH Battle Simulator の Vite + Vue 3 移行プロジェクト Phase 3。

### 完了済み
- **Phase 0**: テスト整備（315テスト）
- **Phase 1**: `scripts/build.mjs` でファイル結合ビルド
- **Phase 2**: 全61 JSソースファイルを ESM 化（import/export 文追加、循環依存解消）

### 現在の構成
- **ブランチ**: `vite-migration`（masterにはまだマージしない）
- **モジュール**: 全ファイルにimport/export文あり（ビルド・テスト・ローカル開発ではフィルタで除去してグローバルスコープで動作）
- **ビルド**: `scripts/build.mjs`（Node.jsでファイル結合、import/export除去フィルタ付き）
- **テスト**: `create_tests.sh`で全ファイル結合 → Jest（jsdom）実行
- **フレームワーク**: Vue 2.5.13, jQuery 3.7.0, Vuex 3.6.2, Select2 4.0.6, Vue.Draggable 2.23.2（すべてCDN）
- **シミュレーター**: 8つ（AetherRaid, Arena, SummonerDuels, DamageCalculator, UnitBuilder, StatusCalculator, HeroIconLister, HeroStatusClusterer）

## 2. 移行目標

### 段階的に以下を実現（各ステップで動作確認しながら進行）:

1. **Vite ビルドへの切り替え** — `build.mjs` の手動結合を Vite（Rollup）バンドルに置き換え
2. **Vitest への移行** — `create_tests.sh` + Jest から Vitest（ESMネイティブ）に移行
3. **ローカル開発の Vite dev server 化** — HTML の loadScripts 方式を Vite dev server に置き換え
4. **Vue 2 → Vue 3 移行** — CDN の Vue 2 を npm の Vue 3 + Pinia に移行
5. **jQuery / jQuery-UI の置き換え** — jQuery 依存をゼロにする

## 3. 詳細要件

### 3.1 Vite ビルド

**出力形式**: HTML ごとに1つの結合 JS ファイル（コード分割なし）
- 理由: デプロイ担当者が別であり、現行フロー（`dist/` に結合JSを出力）との互換性を維持
- Rollup の `output.inlineDynamicImports` または `manualChunks` で単一ファイル化
- 出力先: `dist/` ディレクトリ

**エントリポイント**: 8つのシミュレーター HTML
- Sources/AetherRaidSimulator.html
- Sources/ArenaSimulator.html
- Sources/SummonerDuelsSimulator.html
- Sources/DamageCalculator.html
- Sources/UnitBuilder.html
- Sources/StatusCalculator.html
- Sources/HeroIconLister.html
- Sources/HeroStatusClusterer.html

**ブラウザターゲット**: ES2015 以上

**既存のimport/export文**: Phase 2で追加済みのものをそのまま活用。import/export除去フィルタは不要になる。

### 3.2 Vitest 移行

**移行方式**: 段階的。まず主要テストをVitestに移行し、全完了後にJestを削除。

**主な変更点**:
- `create_tests.sh` の結合ハック廃止 → 各テストファイルが proper import で依存解決
- `jest.config.js` → `vitest.config.js`（または `vite.config.js` に統合）
- `jest.fn()` → `vi.fn()` 等のAPI差分対応
- `globals: true` で Jest 互換グローバル有効化
- `environment: 'jsdom'` 維持

**テスト数**: 315テスト（18テストファイル）すべて最終的にVitestで動作すること。

### 3.3 Vite Dev Server

**ローカル/本番のデータ読み込み統一**:
- 現行: `typeof weaponInfos == 'undefined'` でローカル/本番判定
- 移行後: 環境変数やVite設定で切り替える方式に統一
- Vite の `import.meta.env` を活用

**現行の `createScriptElement` / `loadScripts` を廃止**: Vite が ESM import を直接処理。

### 3.4 Vue 2 → Vue 3 + Pinia

**移行方式**: 直接移行（@vue/compat は使わない）
- 理由: Vue使用がシンプル（CDN、Options API中心）、互換ビルドのオーバーヘッド不要

**主な変更点**:
- `new Vue({ el: '#app' })` → `createApp(App).mount('#app')`
- `Vue.component()` → `app.component()`
- `new Vuex.Store()` → `defineStore()` (Pinia)
- `Vuex.mapState()` → Pinia の `mapState()`
- `beforeDestroy` → `beforeUnmount`（使用箇所があれば）
- Options API はそのまま維持（Composition API への移行は不要）

**Vuex → Pinia**:
- 現在のストアは非常にシンプル（state: appData/battleSimulator/imageRootPath、mutations: なし、actions: 数個）
- mutations 不要になるため、よりシンプルに

**Vue コンポーネント**:
- `select2` — Select2ラッパー → 代替ライブラリに移行
- `unit-detail` — Vuex.mapState → Pinia mapState
- `battle-map` — mounted() フック維持
- `flash-message` — そのまま移行可能

### 3.5 jQuery / jQuery-UI 置き換え

**jQuery 直接使用**: ソースコード内にほぼなし（Select2/jQuery UIが内部で使用）

**Select2**: 英雄/スキル選択ドロップダウンで使用
- 推奨代替: Vue 3対応の選択コンポーネント（Tom Select、vue-select等を調査結果に基づき選定）

**jQuery UI**: ドラッグ&ドロップで使用
- Vue.Draggable 2.x → vuedraggable@next（Vue 3対応版）または SortableJS 直接使用

**LZ-String**: npm パッケージに移行（CDN廃止）
**CropperJS**: npm パッケージに移行（CDN廃止）
**Font Awesome**: npm パッケージまたはCDN維持（どちらでも可）

### 3.6 CI/CD 更新

- Jest → Vitest にテストコマンド更新
- `build.mjs` → `vite build` にビルドコマンド更新
- ESLint は維持
- `create_tests.sh` は最終的に廃止

## 4. 制約・注意点

### SkillImpl ファイル
- `update_skills` ブランチでスキル実装が並行して進行
- Phase 3 では SkillImpl ファイルの import/export 文やモジュール構造を変更**しない**
- Phase 2 で追加済みの import/export 文をそのまま活用

### デプロイ互換性
- 本番サイト（fire-emblem.fun）のデプロイフローとの互換性を維持
- HTML ごとに1つの結合 JS ファイルを `dist/` に出力
- デプロイ担当者が別のため、出力形式の変更は Phase 3 後に調整

### 完了条件
- Vitest で全テスト（315件）がパス
- ブラウザで全8シミュレーターの手動動作確認
- 全確認後に `master` にマージ

## 5. スコープ外

- TypeScript 移行（将来の Phase 4 で検討）
- アプリケーションのリデザインや機能追加
- SFC 化（.vue ファイル化）は任意・段階的に
- デプロイフローの変更（Phase 3 後に別途対応）
