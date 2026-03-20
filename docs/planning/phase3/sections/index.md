<!-- PROJECT_CONFIG
runtime: typescript-npm
test_command: npx vitest run
END_PROJECT_CONFIG -->

<!-- SECTION_MANIFEST
section-01-vite-setup
section-02-vite-build
section-03-vitest-setup
section-04-vitest-migration
section-05-dev-server
section-06-vue3-core
section-07-pinia-migration
section-08-vue3-components
section-09-select2-replacement
section-10-draggable-replacement
section-11-jquery-removal
section-12-ci-cleanup
END_MANIFEST -->

# Implementation Sections Index

## Dependency Graph

| Section | Depends On | Blocks | Parallelizable |
|---------|------------|--------|----------------|
| section-01-vite-setup | - | 02, 03, 05 | Yes |
| section-02-vite-build | 01 | 05, 06 | No |
| section-03-vitest-setup | 01 | 04 | Yes (with 02) |
| section-04-vitest-migration | 03 | 12 | No |
| section-05-dev-server | 02 | 06 | No |
| section-06-vue3-core | 02, 05 | 07, 08 | No |
| section-07-pinia-migration | 06 | 08 | No |
| section-08-vue3-components | 06, 07 | 09, 10 | No |
| section-09-select2-replacement | 08 | 11 | Yes (with 10) |
| section-10-draggable-replacement | 08 | 11 | Yes (with 09) |
| section-11-jquery-removal | 09, 10 | 12 | No |
| section-12-ci-cleanup | 04, 11 | - | No |

## Execution Order

1. **Batch 1**: section-01-vite-setup (no dependencies)
2. **Batch 2**: section-02-vite-build, section-03-vitest-setup (parallel after 01)
3. **Batch 3**: section-04-vitest-migration, section-05-dev-server (parallel after 02/03)
4. **Batch 4**: section-06-vue3-core (after 02, 05)
5. **Batch 5**: section-07-pinia-migration (after 06)
6. **Batch 6**: section-08-vue3-components (after 06, 07)
7. **Batch 7**: section-09-select2-replacement, section-10-draggable-replacement (parallel after 08)
8. **Batch 8**: section-11-jquery-removal (after 09, 10)
9. **Batch 9**: section-12-ci-cleanup (after 04, 11)

## Section Summaries

### section-01-vite-setup
**Plan: Step A.1〜A.2** — Vite の初期セットアップ。package.json への依存追加、vite.config.js の作成（root設定、エントリポイント、出力形式、Vue 3 コンパイラエイリアス準備）。

### section-02-vite-build
**Plan: Step A.3〜A.6** — HTML の修正（動的ローダー → `<script type="module">`）、import/export フィルタ廃止、グローバル変数対応、Vite ビルドの動作確認。

### section-03-vitest-setup
**Plan: Step B.1, B.4** — Vitest のインストールと設定ファイル作成（globals, jsdom, singleThread, setupFiles）。jest.setup.js からの移行。

### section-04-vitest-migration
**Plan: Step B.2〜B.6** — 18テストファイルの段階的 Vitest 移行。各テストへの import 文追加、jest→vi API 変換、全315テストのパス確認。Jest / create_tests.sh の廃止。

### section-05-dev-server
**Plan: Step C.1〜C.4** — Vite dev server の設定。ローカル/本番のデータ読み込み統一（import.meta.env）、.env ファイル作成、HTML 整理、HMR 設定。

### section-06-vue3-core
**Plan: Step D.1〜D.2, D.6** — Vue 3 のインストールと基本設定。CDN → npm 移行、createApp への移行、esm-bundler エイリアス有効化、Vue 2 破壊的変更の対応（$set/$delete 除去、ライフサイクルフック名変更等）。

### section-07-pinia-migration
**Plan: Step D.3** — Vuex → Pinia ストア移行。defineStore の作成、state/actions の移行、コンポーネントからのストアアクセス変更。

### section-08-vue3-components
**Plan: Step D.4〜D.5, D.7〜D.8** — Vue コンポーネントの移行。Vue.component → app.component、unit-detail/battle-map/flash-message の Vue 3 対応、Select2 互換性確認。

### section-09-select2-replacement
**Plan: Step E.1** — Select2 の Vue 3 対応コンポーネントへの置き換え。ライブラリ選定（vue-select / Tom Select）、VueComponents.js の select2 コンポーネント書き換え。

### section-10-draggable-replacement
**Plan: Step E.2** — Vue.Draggable の Vue 3 対応版への移行（vuedraggable@next または SortableJS 直接使用）。

### section-11-jquery-removal
**Plan: Step E.3〜E.4** — jQuery/jQuery UI の CDN 削除。LZ-String/CropperJS/Font Awesome の npm 移行。jQuery 依存ゼロの確認。

### section-12-ci-cleanup
**Plan: Step F.1〜F.4** — CI パイプライン更新（Jest→Vitest、build.mjs→vite build）。不要ファイル削除、package.json 整理、最終動作確認。
