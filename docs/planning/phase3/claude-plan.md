# Phase 3 実装計画: Vite ビルド + Vitest + Vue 3 移行

## 概要

FEH Battle Simulator は Fire Emblem Heroes の戦闘シミュレーターで、8つのシミュレーター（飛空城、闘技場、召喚師決闘、ダメージ計算機、ユニットビルダー、ステータス計算機、英雄アイコン一覧、英雄ステータスクラスタリング）を提供するWebアプリケーション。

現在は Vue 2 + jQuery + Vuex をすべて CDN から読み込み、バンドラーなしの手動ファイル結合（`scripts/build.mjs`）でビルドしている。Phase 2 で全61 JSファイルに import/export 文を追加済み（実行時はフィルタで除去してグローバルスコープで動作）。

Phase 3 ではこの import/export 文を活用し、Vite バンドル + Vitest + Vue 3 + Pinia への移行を段階的に実施する。

### 移行順序

```
Step A: Vite ビルド基盤構築
  ↓
Step B: Vitest 移行（テスト基盤）
  ↓
Step C: Vite Dev Server 化（ローカル開発）
  ↓
Step D: Vue 2 → Vue 3 + Pinia 移行
  ↓
Step E: jQuery / Select2 / Vue.Draggable 置き換え
  ↓
Step F: CI/CD 更新 + クリーンアップ
```

各ステップで動作確認を行い、問題があれば前のステップに戻って修正する。

---

## Step A: Vite ビルド基盤構築

### 目的

`scripts/build.mjs` の手動ファイル結合を Vite（Rollup）バンドルに置き換える。Phase 2 で追加した import/export 文をバンドラーが直接処理できるようにする。

### 前提条件

- 全61 JSファイルに import/export 文あり（Phase 2 完了）
- 循環依存は解決済み（`validate-esm.mjs` で TDZ 検証パス）
- SkillImpl ファイルの import/export 文は変更しない（`update_skills` ブランチとのコンフリクト回避）

### A.1 package.json への依存追加

Vite と関連パッケージを devDependencies に追加:
- `vite` — ビルドツール本体
- `@vitejs/plugin-vue` — Vue SFC サポート（将来の SFC 化に備えて）

### A.2 vite.config.js の作成

プロジェクトルートに `vite.config.js` を作成。

**root 設定**: HTMLファイルが `Sources/` 配下にあるため、`root: 'Sources'` を設定し、`build.outDir: '../dist'` で出力先を調整する。これにより、dev server のURL構造や相対パス（CSS、画像等）の解決が正しく動作する。

**エントリポイント**: 8つのシミュレーター HTML を `build.rollupOptions.input` に設定。`root: 'Sources'` 設定により、パスは `*.html` 形式で指定。

**出力形式**: HTML ごとに1つの結合 JS ファイルを出力。デプロイ担当者が別のため、現行の「1ファイルに全部入り」形式を維持する。Rollup の `output.inlineDynamicImports` は単一エントリポイントのみ対応なので、マルチページの場合は `output.manualChunks` で全モジュールを単一チャンクにまとめるか、エントリポイントごとに個別ビルドを実行する方式を検討。後者（8回個別ビルド）はフォールバック策として確保しておく。

**Vue 3 ランタイムコンパイラ設定**: 本プロジェクトは SFC を使わず HTML 内に Vue テンプレートを直接記述しているため、Vue 3 のランタイム専用ビルド（デフォルト）ではテンプレートが処理されない。`resolve.alias` で `vue` を `vue/dist/vue.esm-bundler.js`（コンパイラ込みビルド）に向ける必要がある。これは Step D の Vue 3 導入時に設定するが、vite.config.js の初期作成時から考慮しておく。

**ブラウザターゲット**: `build.target` を `es2015` に設定。

**出力先**: `dist/` ディレクトリ（`build.outDir: '../dist'`）。

### A.3 HTML の修正

現在の HTML には `loadScripts` / `createScriptElement` による動的スクリプト読み込みロジックがある。Vite 用に HTML を修正:

- CDN の `<script>` タグはそのまま維持（Step D/E で npm 移行時に変更）
- 動的ローダー（`createScriptElement`, `loadScripts`）を Vite エントリポイントの `<script type="module" src="./XxxMain.js">` に置き換え
- `Local.js` のファイルリスト定義は Vite が不要とするため、ローカル開発用の参照を変更

### A.4 import/export フィルタの段階的廃止

Vite がモジュールを直接処理するため、以下のフィルタは不要になる:
- `build.mjs` の `filterImportExport()` — Vite ビルドが代替
- HTML の `createScriptElement` 内のフィルタ — Vite dev server が代替
- `create_tests.sh` のフィルタ — Vitest が代替（Step B で対応）

ただし、フィルタ廃止は段階的に行う。まず Vite ビルドが動作することを確認してから、旧ビルドスクリプトを廃止する。

### A.5 グローバル変数の扱い

現在のコードはグローバルスコープで多数の変数を共有している（`g_app`, `g_appData`, `heroInfos` 等）。Vite のモジュールシステムでは各ファイルがスコープを持つため:

- Phase 2 の import/export 文により、モジュール間の依存関係は明示的に定義済み
- グローバル変数は ESM の export/import で置き換わる
- ただし、HTML テンプレート内の `{{ }}` から参照されるデータや、CDN ライブラリ（Vue, jQuery）が window に設定するグローバルは残る
- `window` への明示的な代入が必要な箇所を特定し、対応する

### A.6 動作確認

- `vite build` で8つのシミュレーター分のバンドルが正常に生成されること
- 生成されたバンドルのファイルサイズが現行の `build.mjs` 出力と大きく乖離しないこと
- `dist/` の出力構造が現行デプロイフローと互換であること

---

## Step B: Vitest 移行

### 目的

`create_tests.sh` + Jest の結合テスト方式を廃止し、Vitest（ESM ネイティブ）に移行。各テストファイルが proper import で依存を解決する。

### B.1 Vitest の設定

`vite.config.js` に `test` セクションを追加（または別途 `vitest.config.js`）:
- `globals: true` — Jest 互換の describe/it/expect をグローバルで使用
- `environment: 'jsdom'` — DOM テスト環境
- `setupFiles` — Jest の `jest.setup.js` に相当するセットアップファイル
- `include: ['Tests/**/*.test.js']` — テストファイルのパターン（結合 `All.test.js` は不要）
- `pool: 'threads'` + `poolOptions.threads.singleThread: true` — 移行初期は直列実行を強制。元々単一結合スクリプトで動いていたテストはグローバル状態を共有している可能性が高く、並列実行するとflakyテストの温床になる。全テスト移行完了後に並列化を検討。

### B.2 テストファイルの修正

現在の18テストファイルは、`create_tests.sh` で全ソースと結合されることを前提として書かれている。Vitest では各テストファイルが独立して動作する必要がある:

- 各テストファイルの先頭に必要な import 文を追加
- テストユーティリティ（`TestGlobals.js`, `TestUtilities.js`）からのインポート
- ソースモジュールからの直接インポート（`Unit`, `DamageCalculator` 等）

### B.3 jest → vi の API 差分対応

現在のテストで `jest.*` API を使用している箇所を `vi.*` に変更:
- `jest.fn()` → `vi.fn()`
- `jest.mock()` → `vi.mock()`
- `jest.spyOn()` → `vi.spyOn()`

自動変換ツール `npx codemod jest/vitest` で大部分を変換可能。残りは手動修正。

### B.4 セットアップファイルの移行

`jest.setup.js` のポリフィル（`perf_hooks.performance`, `TextEncoder`, `TextDecoder`）を Vitest 用セットアップファイルに移行。jsdom 環境では一部のポリフィルが不要になる可能性があるため、必要性を確認。

### B.5 段階的移行の手順

1. Vitest をインストールし、設定ファイルを作成
2. 最もシンプルなテストファイル（`SmokeTest.test.js`, `SimpleUtility.test.js`）から移行開始
3. 各テストファイルに import 文を追加し、Vitest で動作確認
4. Jest 環境は並行して維持（`npm test` は Jest、`npx vitest` は Vitest）
5. 全18テストファイル（315テスト）が Vitest でパスしたら、Jest を削除

### B.6 create_tests.sh の廃止

全テストが Vitest に移行完了後:
- `create_tests.sh` を削除
- `jest.config.js`, `jest.setup.js` を削除
- Jest 関連の devDependencies を削除
- `package.json` の `test` スクリプトを Vitest に変更

---

## Step C: Vite Dev Server 化

### 目的

HTML の `loadScripts` / `createScriptElement` による動的スクリプト読み込みを Vite dev server に置き換え、ローカル開発体験を改善する。

### C.1 ローカル/本番のデータ読み込み統一

現在の方式:
- ローカル: `typeof weaponInfos == 'undefined'` で判定し、ファイルから読み込み
- 本番: 外部 CDN からデータ（weaponInfos, heroInfos 等）を読み込み

統一後の方式:
- `import.meta.env.MODE` または カスタム環境変数 で環境を判定
- `.env.development` / `.env.production` で環境固有の設定を管理
- データ読み込みロジックを統一し、環境変数で読み込み元を切り替え

### C.2 HTML の整理

Vite dev server では:
- `<script type="module" src="./XxxMain.js">` でエントリポイントを読み込み
- Vite が import をたどって全モジュールを自動的にロード
- `loadScripts`, `createScriptElement`, `Local.js` のファイルリストは不要

### C.3 開発サーバーの設定

`vite.config.js` に dev server 設定を追加:
- 複数 HTML エントリポイントへのルーティング
- 必要に応じてプロキシ設定（外部データ取得用）

### C.4 HMR（Hot Module Replacement）

Vite の HMR を活用し、コード変更時にブラウザが自動更新される環境を構築。Vue コンポーネントの HMR は `@vitejs/plugin-vue` が提供。

---

## Step D: Vue 2 → Vue 3 + Pinia 移行

### 目的

CDN の Vue 2.5.13 + Vuex 3.6.2 を npm の Vue 3 + Pinia に移行。Options API はそのまま維持。

### D.1 Vue 3 のインストール

npm パッケージとして Vue 3 と Pinia をインストール:
- `vue@3` — Vue 本体
- `pinia` — 状態管理（Vuex 代替）

CDN の Vue 2 / Vuex の `<script>` タグを削除。

### D.2 Vue インスタンスの移行

現在の `BattleSimulatorBase.js` の `#create_vue()` メソッドを修正:

**現行パターン**:
```
new Vuex.Store({ state, mutations, actions })
new Vue({ el: '#app', store, data, methods })
```

**移行後パターン**:
```
createApp({ data(), methods }).use(createPinia()).mount('#app')
```

### D.3 Vuex → Pinia ストアの移行

現在の Vuex ストアは非常にシンプル:
- **state**: `appData`, `battleSimulator`, `imageRootPath`
- **mutations**: なし
- **actions**: `updateMap`, `saveSettings`, `showSettingDialog` 等

Pinia ストアに変換:
- `defineStore('main', { state, actions })` 形式
- mutations は元々なかったため、移行の手間なし
- actions はほぼそのまま移行

### D.4 コンポーネントの移行

`VueComponents.js` の4コンポーネントを移行:

**`select2` コンポーネント**: Step E で Select2 自体を置き換えるため、ここでは Vue 3 構文への最小限の修正のみ。

**`unit-detail` コンポーネント**: `Vuex.mapState()` → Pinia の `mapState()` に変更。多数の v-model バインディングはそのまま動作。

**`battle-map` コンポーネント**: `mounted()` フック内の処理はそのまま維持。

**`flash-message` コンポーネント**: props ベースのシンプルなコンポーネントなので、ほぼ変更なし。

### D.5 `Vue.component()` → `app.component()` の移行

現在 `Vue.component('select2', ...)` 等でグローバル登録している箇所を `app.component()` に変更。`createApp` で生成した app インスタンスに対してコンポーネントを登録する。

### D.6 Vue 2 → 3 の破壊的変更への対応

Step D の初期段階で、まず全ソースを grep して Vue 2 固有 API の使用箇所を網羅的に洗い出す。

**必須対応項目**:
- `data` オプション: ルートインスタンスでもオブジェクトではなく関数にする（`data: appData` → `data() { return appData }`）
- `v-model` の仕様変更: カスタムコンポーネントでの `v-model` は `modelValue` prop + `update:modelValue` event に変更
- ライフサイクルフック名: `beforeDestroy` → `beforeUnmount`, `destroyed` → `unmounted`（使用箇所を確認）
- filters: 使用していなければ対応不要（リサーチでは未確認）
- `Vue.set()` / `this.$set()` / `this.$delete()` の廃止: Vue 3 は Proxy ベースになったため不要。通常の代入（`obj.key = value`）や `delete obj.key` に書き換える。レガシーコードに残っている可能性が高いため、grep で全使用箇所を特定する。
- グローバル変数のテンプレート参照: Vue 3 ではコンポーネントの `data`/`methods`/`computed` で明示的に定義されていない変数をテンプレートから直接参照できない。`window.g_appData` 等のグローバル変数がテンプレートで使用されている箇所は、`app.config.globalProperties` への登録、または `data`/`computed` での明示的な返却が必要。

### D.7 Select2 との互換性注意

Step D で Vue 3 に移行する際、jQuery ベースの Select2 コンポーネントが Vue 3 の Proxy リアクティビティシステムと干渉する可能性がある。Select2 は DOM を直接操作するため、Vue 3 のリアクティビティ追跡と競合することがある。Step D 完了後の動作確認で Select2 関連の不具合が確認された場合、Step E の Select2 置き換えを前倒しする。

### D.8 動作確認

- 全8シミュレーターが Vue 3 で正常に描画・操作できること
- Vuex の state/actions が Pinia に正しく移行されていること
- Vitest の全テストがパスすること

---

## Step E: jQuery / Select2 / Vue.Draggable 置き換え

### 目的

jQuery 依存をゼロにし、全ライブラリを npm パッケージまたはネイティブ実装に置き換える。

### E.1 Select2 の置き換え

Select2 は英雄/スキル選択のドロップダウンに使用されている。Vue 3 対応の選択コンポーネントに置き換え。

**候補ライブラリ**:
- **vue-select**: Vue 3 対応、Select2 に似た API、検索・フィルタ機能内蔵
- **Tom Select**: jQuery 不要、軽量、Select2 互換 API

選定基準: Vue 3 との統合のしやすさ、現在の Select2 の使用パターン（検索可能ドロップダウン、多数のオプション）との互換性。

`VueComponents.js` の `select2` コンポーネントを新しいライブラリに置き換え。Vue のカスタムコンポーネントラッパーとして実装し、既存の使用箇所（`<select2>` タグ）への影響を最小化。

### E.2 Vue.Draggable の置き換え

Vue.Draggable 2.x はユニットリストの並び替えに使用。Vue 3 対応版に移行:
- **vuedraggable@next** (zhyswan-vue-draggable-plus): Vue 3 + SortableJS ベース
- または SortableJS を直接使用して Vue 3 カスタムディレクティブで統合

### E.3 jQuery / jQuery UI の削除

jQuery はソースコード内で直接使用されていない（Select2 と jQuery UI の依存のみ）。Select2 と Vue.Draggable を置き換えた後:
- jQuery CDN の `<script>` タグを削除
- jQuery UI CDN の `<script>` タグを削除
- jQuery UI のドラッグ機能が他で使われていないか最終確認

### E.4 その他の CDN ライブラリの npm 移行

| ライブラリ | 対応 |
|-----------|------|
| LZ-String | npm パッケージに移行（`lz-string`）|
| CropperJS | npm パッケージに移行（`cropperjs`）|
| Sortable.js | vuedraggable の依存として含まれる、または個別インストール |
| Font Awesome | npm パッケージ（`@fortawesome/fontawesome-free`）またはCDN維持 |

### E.5 動作確認

- 英雄/スキル選択ドロップダウンが正常に動作すること
- ユニットリストのドラッグ並び替えが正常に動作すること
- jQuery/jQuery UI が完全に不要になっていること（CDN 削除後も動作すること）

---

## Step F: CI/CD 更新 + クリーンアップ

### F.1 CI パイプラインの更新

`.github/workflows/` のワークフローファイルを更新:
- テストコマンド: `jest` → `vitest run`
- ビルドコマンド: `node scripts/build.mjs` → `vite build`
- ESLint は維持

### F.2 不要ファイルの削除

移行完了後に削除するファイル:
- `scripts/build.mjs` — Vite に置き換え
- `create_tests.sh` — Vitest に置き換え
- `jest.config.js`, `jest.setup.js` — Vitest に置き換え
- `Sources/Local.js` — Vite が不要とする（または参照のみに縮小）
- HTML 内の `createScriptElement`, `loadScripts` ロジック
- Phase 2 の ESM 検証スクリプト（`validate-esm.mjs`, `check-esm-coverage.mjs`）— Vite のモジュール解決に置き換え

### F.3 package.json の整理

- Jest 関連の devDependencies を削除
- npm scripts を更新:
  - `test` → `vitest run`
  - `test:watch` → `vitest`
  - `build` → `vite build`
  - `dev` → `vite`（dev server 起動）
  - `deploy` → 既存のデプロイフローとの互換性を維持

### F.4 最終動作確認

- `vite build` で全8シミュレーターのバンドルが正常生成
- `vitest run` で全315テストがパス
- `vite` で dev server が起動し、ブラウザで各シミュレーターが動作
- CI でテスト + ビルドが成功
- ブラウザで全8シミュレーターの手動動作確認

---

## リスクと緩和策

### グローバル変数の移行

**リスク**: 多数のグローバル変数（`g_app`, `g_appData`, 各種データベース）がESMモジュールスコープに閉じ込められ、他のモジュールからアクセスできなくなる。

**緩和策**: Phase 2 で import/export 文は追加済みなので、Vite はこれらを正しく解決できるはず。ただし、HTML テンプレート内からの参照や、CDN ライブラリとの連携で問題が出る可能性がある。Step A で早期に検証。

### SkillImpl ファイルのコンフリクト

**リスク**: `update_skills` ブランチで並行して SkillImpl ファイルが更新されている。

**緩和策**: Phase 3 では SkillImpl ファイルの import/export 文を変更しない。Vite は Phase 2 で追加済みの import/export をそのまま処理する。

### 1ファイル出力の制約

**リスク**: Vite のマルチページモードで「各ページに1つの結合JSファイル」を実現するのが標準的でない。

**緩和策**: Rollup の設定で対応可能。`manualChunks` でエントリポイントごとに全モジュールをインライン化するか、個別ビルドを実行する。最悪の場合、Vite のプラグインで対応。

### テスト移行の複雑さ

**リスク**: 結合テスト（All.test.js）方式から個別テストへの移行で、暗黙のグローバル依存が発覚する可能性。

**緩和策**: 段階的に移行し、シンプルなテストから開始。各テストファイルの依存を明示的にimportする作業が必要。

### Vue 2 → 3 の非互換性

**リスク**: Vue 2 固有の機能（filters, $on/$off, $children 等）を使用している箇所が未発見の可能性。

**緩和策**: Step D の初期に全ソースを grep して Vue 2 固有 API の使用箇所を網羅的に洗い出す。

---

## ディレクトリ構造（移行後の想定）

```
FehBattleSimulator/
├── Sources/
│   ├── *.html              # 8つのシミュレーター HTML（Vite エントリ）
│   ├── *.js                # 全 JS ソースファイル（ESM import/export 有効）
│   ├── *.css               # スタイルシート
│   └── ...
├── Tests/
│   ├── *.test.js           # 18テストファイル（Vitest で直接実行）
│   └── ...
├── dist/                   # Vite ビルド出力
├── vite.config.js          # Vite 設定
├── vitest.setup.js         # Vitest セットアップ
├── package.json            # Vite + Vitest + Vue 3 + Pinia
├── .env.development        # ローカル環境設定
├── .env.production         # 本番環境設定
└── ...
```
