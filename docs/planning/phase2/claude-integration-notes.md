# External Review 統合メモ

## Gemini レビューの主要指摘と対応

### 採用する指摘

#### 1. 正規表現による import/export 除去の脆弱性（クリティカル）

**指摘**: 複数行にわたる import/export を正規表現で除去すると破綻する。
```javascript
import {
    Weapon,
    Support,
    Special
} from './SkillConstants.js';
```

**対応**: 採用する。これは重大な問題。以下の対策を計画に追加:
- **コーディング規約**: import/export は必ず1行で書く（複数行禁止）
- **build.mjs のフィルタ**: 複数行対応の正規表現に強化（`/^import\s+[\s\S]*?;\s*$/gm` ではなく、状態ベースの行単位処理）
- **検証テスト**: フィルタ適用後の出力に `import` / `export` キーワードが残っていないことを確認するテストを追加

#### 2. export スタイルの統一（インライン export 禁止）

**指摘**: `export class` や `export function` のインライン export と末尾まとめ export が混在すると、正規表現フィルタが複雑化する。

**対応**: 採用する。末尾 `export { ... };` に統一し、インライン export を禁止。フィルタは `export {` で始まる行の除去だけで済む。

#### 3. Phase 2 完了前にネイティブ ESM での検証

**指摘**: 結合モードでは動くが、ネイティブ ESM モードでは TDZ エラーが出る循環依存を見逃すリスク。

**対応**: 採用する。Phase 2 の完了基準に「エントリポイントを ESM として直接実行し、TDZ エラーが出ないことを確認」を追加。

#### 4. 外部ライブラリ（Vue 等）の扱い

**指摘**: Vue 2 は CDN でグローバルに読み込まれるが、ESM 化時の扱いが記載されていない。

**対応**: 採用する。Phase 2 では外部ライブラリは ESM import せず、グローバル参照のまま。`/* global Vue, jQuery */` コメントで ESLint 対応。Phase 3 で npm パッケージからの import に切り替え。

### 採用しない指摘

#### ローカル開発の `<script type="module">` 移行リスク

**指摘**: `loadScripts` を `type="module"` に変更するとスコープ変更で全滅する。

**判断**: 計画では既に「Phase 2 の最終段階で対応、または Phase 3 まで現行方式を維持」としており、Phase 2 のスコープ外。この指摘は正しいが、既に対処済み。

#### AST ベースのツールの導入

**指摘**: 正規表現ではなく esbuild/Babel/Rollup で import/export をストリップすべき。

**判断**: 不採用。Phase 2 のスコープは ESM 化のみであり、ビルドツールの導入は Phase 3。正規表現フィルタを1行 import/export に限定する規約で十分安全。将来 Phase 3 で Vite/Rollup に移行すれば、このフィルタ自体が不要になる。
